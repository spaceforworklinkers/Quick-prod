import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Cafes from './pages/Cafes';
import Subscriptions from './pages/Subscriptions';
import Users from './pages/Users';
import Finance from './pages/Finance';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/cafes" element={<Cafes />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/users" element={<Users />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
