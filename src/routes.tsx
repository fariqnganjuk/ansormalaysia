import { lazy, type ReactNode } from 'react';

const Home = lazy(() => import('./pages/Home'));
const NewsList = lazy(() => import('./pages/NewsList'));
const ActivityList = lazy(() => import('./pages/ActivityList'));
const InspirationList = lazy(() => import('./pages/InspirationList'));
const OpinionList = lazy(() => import('./pages/OpinionList'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Advocacy = lazy(() => import('./pages/Advocacy'));
const OrganizationInfo = lazy(() => import('./pages/OrganizationInfo'));
const DataInfographics = lazy(() => import('./pages/DataInfographics'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const PostManagement = lazy(() => import('./pages/admin/PostManagement'));
const ComplaintManagement = lazy(() => import('./pages/admin/ComplaintManagement'));
const NotFound = lazy(() => import('./pages/NotFound'));

export interface RouteConfig {
  path: string;
  element: ReactNode;
  name?: string;
}

const routes: RouteConfig[] = [
  { path: '/', element: <Home />, name: 'Beranda' },
  { path: '/berita', element: <NewsList />, name: 'Berita PMI' },
  { path: '/kegiatan', element: <ActivityList />, name: 'Kegiatan' },
  { path: '/inspirasi', element: <InspirationList />, name: 'Tokoh & Inspirasi' },
  { path: '/opini', element: <OpinionList />, name: 'Opini & Analisis' },
  { path: '/post/:slug', element: <PostDetail /> },
  { path: '/advokasi', element: <Advocacy />, name: 'Advokasi' },
  { path: '/organisasi', element: <OrganizationInfo />, name: 'Organisasi' },
  { path: '/data', element: <DataInfographics />, name: 'Data & Infografis' },
  { path: '/tentang', element: <AboutUs />, name: 'Tentang Kami' },
  { path: '/kontak', element: <Contact />, name: 'Kontak' },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/dashboard/posts', element: <PostManagement /> },
  { path: '/dashboard/complaints', element: <ComplaintManagement /> },
  { path: '*', element: <NotFound /> },
];

export default routes;
