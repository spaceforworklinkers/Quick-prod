import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 1. Verify Caller (Must be Super Admin)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) throw new Error('Invalid token')

        // Check Role in DB
        const { data: callerProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!callerProfile || !['OWNER_SUPER_ADMIN', 'SUPER_ADMIN'].includes(callerProfile.role)) {
            return new Response(
                JSON.stringify({ success: false, error: 'Unauthorized: Super Admin required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
        }

        // 2. Parse Input
        const { email, password, fullName, role } = await req.json()

        if (!['ADMIN', 'MANAGER', 'SALESPERSON', 'ACCOUNTANT', 'SUPER_ADMIN'].includes(role)) {
            return new Response(
                JSON.stringify({ success: false, error: 'Invalid role specified' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Soft error
            )
        }

        // 3. Create Auth User
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        })

        if (createError) throw createError
        const newUserId = authData.user.id

        // 4. Create Profile (or Ensure it exists if trigger didn't catch it)
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: newUserId,
                email: email,
                full_name: fullName,
                role: role,
                is_active: true
            })

        if (profileError) throw profileError

        // 5. Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            action: 'CREATE_USER',
            entity_type: 'user',
            entity_id: newUserId,
            details: { role, created_by: user.id },
            actor_id: user.id
        })

        return new Response(
            JSON.stringify({ success: true, userId: newUserId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 } // Soft error to show message
        )
    }
})
