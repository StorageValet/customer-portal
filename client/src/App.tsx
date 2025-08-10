import { Route, Switch } from 'wouter';
import SignupPage from './pages/signup';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
export default function App() {
  return (<Switch><Route path="/signup" component={SignupPage} /><Route path="/login" component={LoginPage} /><Route path="/dashboard" component={Dashboard} /><Route>404</Route></Switch>);
}
