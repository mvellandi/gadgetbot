import { signOut } from "@/web/auth/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/web/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/web/components/ui/dropdown-menu"
import type { User } from "@/auth/types"

interface UserMenuProps {
	user: User
}

/**
 * UserMenu Component
 *
 * Displays user avatar and dropdown menu with:
 * - User name/email
 * - Profile link (future)
 * - Settings link (future)
 * - Sign out button
 */
export function UserMenu({ user }: UserMenuProps) {
	const handleSignOut = async () => {
		await signOut()
		window.location.href = "/"
	}

	// Generate initials from name or email
	const getInitials = (name?: string | null, email?: string | null) => {
		if (name) {
			const names = name.split(" ")
			if (names.length >= 2) {
				return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
			}
			return name.substring(0, 2).toUpperCase()
		}
		if (email) {
			return email.substring(0, 2).toUpperCase()
		}
		return "U"
	}

	const initials = getInitials(user.name, user.email)
	const displayName = user.name || user.email || "User"

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex items-center space-x-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
				>
					<Avatar className="h-8 w-8">
						<AvatarImage src={user.image || undefined} alt={displayName} />
						<AvatarFallback className="bg-blue-500 text-white text-xs">
							{initials}
						</AvatarFallback>
					</Avatar>
					<span className="text-sm font-medium text-gray-700 hidden sm:inline">
						{displayName}
					</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium">{displayName}</p>
						{user.email && (
							<p className="text-xs text-gray-500">{user.email}</p>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled className="text-gray-400">
					Profile (Coming Soon)
				</DropdownMenuItem>
				<DropdownMenuItem disabled className="text-gray-400">
					Settings (Coming Soon)
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleSignOut}
					className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
				>
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
