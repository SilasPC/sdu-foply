import { Component, EventEmitter, Output } from '@angular/core';
import { User } from 'src/app/models/User';

/**
 * Component representing a search bar for users.
 * Provides (onClick) output, which emits with a `User`
 *   when a search result is clicked.
 */
@Component({
	selector: 'user-search-bar',
	templateUrl: './template.html',
})
export class UserSearchBarComponent {

	@Output()
	public onClick = new EventEmitter<User>()

	public error = false
	public result: User[] | null = null
	public text = ''

	/** Handles when a search result is clicked */
	didClickMsg(user: User) {
		this.onClick.emit(user)
		this.text = ''
	}

	/** Updates search results */
	async onChange() {
		if (!this.text) {
			this.error = false
			this.result = null
			return
		}
		const users = await User.search(this.text)
		if (!users) {
			this.error = true
			return
		}
		this.error = false
		this.result = users
	}

}
