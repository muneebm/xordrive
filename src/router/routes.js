
const routes = [
  {
    path: '/',
    component: () => import('layouts/DriveLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Drive.vue') }
    ]
  },
  {
    path: '/public',
    component: () => import('pages/Public.vue')
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('layouts/HomeLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Home.vue') }
    ]
  })
}

export default routes
