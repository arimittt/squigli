$(() => {
	let id = 0
	const socket = io()
	let acceleration = 0
	const readingEl = $('.reading')

	// Get UID from URL

	const getQueryParams = (params, url) => {
		let href = url
		let reg = new RegExp( '[?&]' + params + '=([^&#]*)', 'i' )
		let queryString = reg.exec(href)
		return queryString ? queryString[1] : null
	}

	id = getQueryParams('id', window.location.href)

	// Listen for change in device orientation

	window.addEventListener('deviceorientation', e => {
		if (e.beta !== null && e.beta !== undefined) {
			// Implements correction since beta may jump from -180 to 180 and vice-versa
			acceleration = e.beta + (e.beta > 90 ? -180 : (e.beta < -90 ? 180 : 0))
			
			// Emits the current reading

			socket.emit('whipControllerOutput', {
				id: id,
				reading: acceleration
			})
			updateReading()
		}
	}, true)

	// Updates the reading on the mobile DOM

	function updateReading() {
		$(readingEl).html(parseInt(acceleration) + '°')
	}

	// Communicates any changes in parameters to the desktop client
	
	function updateParameters() {
		let params = {}
		let settings = $('.settings-item')
		for (setting of settings) {
			params[$(setting).attr('data-key')] = $(setting).hasClass('checked')
		}
		socket.emit('whipControllerParameters', {
			id: id,
			params: params
		})
	}

	$('.settings-item').on('click', function (e) {
		$(this).toggleClass('checked')
		updateParameters()
	})
})