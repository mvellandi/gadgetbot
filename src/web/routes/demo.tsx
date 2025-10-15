import { Outlet, createFileRoute } from '@tanstack/react-router'

import Header from '@/web/demo/components/Header'

export const Route = createFileRoute('/demo')({
	component: DemoLayout,
})

function DemoLayout() {
	return (
		<>
			<Header />
			<Outlet />
		</>
	)
}
