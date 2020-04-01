$(() => {
	let id = 0
	const socket = io()
	let acceleration = 0
	const readingEl = $('.reading')

	const getQueryParams = (params, url) => {
		let href = url
		let reg = new RegExp( '[?&]' + params + '=([^&#]*)', 'i' )
		let queryString = reg.exec(href)
		return queryString ? queryString[1] : null
	}

	id = getQueryParams('id', window.location.href)

	window.addEventListener('deviceorientation', e => {
		if (e.beta !== null && e.beta !== undefined) {
			acceleration = e.beta + (e.beta > 90 ? -180 : (e.beta < -90 ? 180 : 0))
			
			socket.emit('whipControllerOutput', {
				id: id,
				reading: acceleration
			})
			updateReading()
		}
	}, true)

	function updateReading() {
		$(readingEl).html(parseInt(acceleration) + '°')
	}

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