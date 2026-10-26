import { createRouter, createWebHistory } from 'vue-router'
import AdminGoodsEditInsidePage from '../components/admin/AdminGoodsEditInsidePage.vue'
import AdminGoodsEditingPage from '../components/admin/AdminGoodsEditingPage.vue'
import AdminHomePage from '../components/admin/AdminHomePage.vue'
import AdminOrderManagePage from '../components/admin/AdminOrderManagePage.vue'
import AdminRoleManagePage from '../components/admin/AdminRoleManagePage.vue'
import CartPage from '../components/user/CartPage.vue'
import OrderLog from '../components/user/OrderLog.vue'
import LoginPage from '../components/auth/LoginPage.vue'
import RegisterPage from '../components/auth/RegisterPage.vue'
import AdminLayout from '../components/layout/AdminLayout.vue'
import AuthLayout from '../components/layout/AuthLayout.vue'
import UserLayout from '../components/layout/UserLayout.vue'
import AllGoodsPage from '../components/user/AllGoodsPage.vue'
import GoodsDescriptionPage from '../components/user/GoodsDescriptionPage.vue'
import OrderProgressPage from '../components/user/OrderProgressPage.vue'
import PaymentPage from '../components/user/PaymentPage.vue'
import ProfilePage from '../components/user/ProfilePage.vue'
import RecommendedGoodsPage from '../components/user/RecommendedGoodsPage.vue'
import { hasAuthSession } from '../stores/authStore'

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', redirect: '/auth/login' },
		{
			path: '/auth',
			component: AuthLayout,
			children: [
				{ path: 'login', name: 'auth-login', component: LoginPage },
				{ path: 'register', component: RegisterPage },
			],
		},
		{
			path: '/admin',
			component: AdminLayout,
			redirect: '/admin/dashboard',
			children: [
				{ path: 'dashboard', component: AdminHomePage },
				{ path: 'goods', component: AdminGoodsEditingPage },
				{ path: 'goods/:id/edit', component: AdminGoodsEditInsidePage, props: true },
				{ path: 'orders', component: AdminOrderManagePage },
				{ path: 'roles', component: AdminRoleManagePage },
			],
		},
		{
			path: '/user',
			component: UserLayout,
			redirect: '/user/goods/recommended',
			children: [
				{ path: 'goods', component: AllGoodsPage },
				{ path: 'goods/recommended', component: RecommendedGoodsPage },
				{ path: 'cart', component: CartPage, meta: { requiresAuth: true } },
				{ path: 'goods/:id', component: GoodsDescriptionPage, props: true },
				{ path: 'orders', component: OrderLog, meta: { requiresAuth: true } },
				{ path: 'orders/:id/progress', component: OrderProgressPage, props: true, meta: { requiresAuth: true } },
				{ path: 'payment', component: PaymentPage, meta: { requiresAuth: true } },
				{ path: 'profile', component: ProfilePage, meta: { requiresAuth: true } },
			],
		},
	],
})

router.beforeEach(async (to) => {
	if (to.matched.some((record) => record.meta.requiresAuth) && !(await hasAuthSession())) {
		return { name: 'auth-login', query: { redirect: to.fullPath } }
	}
})

export default router
