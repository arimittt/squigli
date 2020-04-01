$(() => {
	let id = parseInt(Math.random() * 10000)

	const whipCanvas = $('.whip-canvas')[0]
	const whipCtx = whipCanvas.getContext('2d')
	const socket = io()

	let curOffset = 0

	window.addEventListener('resize', resizeWindow)

	function resizeWindow () {
		whipCanvas.width = window.innerWidth
		whipCanvas.height = window.innerHeight

		samplePoint = parseInt(whipCanvas.width / 2)
	}

	function runWhip () {
		const ropeRadius = remToPx(1.5 / 2)

		const Engine = Matter.Engine,
					Render = Matter.Render,
					Runner = Matter.Runner,
					Body = Matter.Body,
					Composite = Matter.Composite,
					Composites = Matter.Composites,
					Constraint = Matter.Constraint,
					MouseConstraint = Matter.MouseConstraint,
					Mouse = Matter.Mouse,
					World = Matter.World,
					Bodies = Matter.Bodies
		
		const engine = Engine.create(),
					world = engine.world
		
		const render = Render.create({
			canvas: whipCanvas,
			engine: engine,
			options: {
				width: window.innerWidth,
				height: window.innerHeight,
				wireframes: false,
				background: 'none'
			}
		})

		Render.run(render)

		const runner = Runner.create()
		Runner.run(runner, engine)

		let group = Body.nextGroup(true)
		const rope = Composites.stack(0, whipCanvas.height / 2, parseInt(whipCanvas.width / (2 * ropeRadius)), 1, 10, 10, (x, y) => {
			return Bodies.circle(x, y, ropeRadius, {
				collisionFilter: {
					group: group
				},
				render: {
					fillStyle: '#BFA185'
				}
			})
		})

		Composites.chain(rope, 0.5, 0, -0.5, 0, { stiffness: 1, length: 0 })
		Composite.add(rope, Constraint.create({
			bodyB: rope.bodies[0],
			pointB: { x: -20, y: 0 },
			pointA: { x: rope.bodies[0].position.x - 20, y: rope.bodies[0].position.y },
			stiffness: 0.5
		}))

		World.add(world, [rope])

		engine.world.gravity.y = 0
		engine.world.gravity.x = 1

		const mouse = Mouse.create(render.canvas),
					mouseConstraint = MouseConstraint.create(engine, {
						mouse: mouse,
						constraint: {
							stiffness: 0.2,
							render: {
								visible: false
							}
						}
					})

		World.add(world, mouseConstraint)

		render.mouse = mouse

		Render.lookAt(render, {
			min: { x: 0, y: 0 },
			max: { x: window.innerWidth, y: window.innerHeight }
		})

		Body.setStatic(rope.bodies[0], true)
		Body.setPosition(rope.bodies[0], {
			x: 0,
			y: whipCanvas.height / 2
		})

		Body.setStatic(rope.bodies[rope.bodies.length - 1], true)
		Body.setPosition(rope.bodies[rope.bodies.length - 1], {
			x: whipCanvas.width,
			y: whipCanvas.height / 2
		})

		socket.on(`whipControllerInput-${id}`, data => {
			Body.setPosition(rope.bodies[rope.bodies.length - 1], {
				x:  whipCanvas.width,
				y: (whipCanvas.height / 2) - (data * 2)
			})
		})

		let samplePoint = parseInt(rope.bodies.length / 2)

		function checkSample () {
			curOffset = (whipCanvas.height / 2) - rope.bodies[samplePoint].position.y
			window.requestAnimationFrame(checkSample)
		}

		checkSample()
	}

	function generateQRCode () {
		let link = window.location.href + (window.location.href[window.location.href.length - 1] == '/' ? '' : '/') + 'controller?id=' + id

		let qrCode = new QRCode('qr-container', {
			text: link,
			width: remToPx(8),
			height: remToPx(8),
			colorDark: '#706051',
			colorLight: '#FFFFFF'
		})

		$('#qr-container').append(`
			<p>Scan the code to open the <a href="${link}" target="_blank">CONTROLLER</a> on your phone.</p>
		`)
	}

	function generateAudio () {
		let settings = {
			baselineVolume: 0,
			volumeSensitivity: 0.25,
			baselinePitch: 440,
			pitchSensitivity: 10
		}
		let params = {
			volume: true,
			pitch: false,
			key: false
		}
		let paramFunctions = [
			function () {
				synth.volume.value = settings.baselineVolume + (Math.abs(curOffset) * settings.volumeSensitivity)
			}
		]

		const synth = new Tone.Synth().toMaster()

		socket.on(`whipControllerParameters-${id}`, data => {
			params = Object.assign(params, data)

			paramFunctions = []

			if (params.volume) {
				paramFunctions.push(function () {
					synth.volume.value = settings.baselineVolume + (Math.abs(curOffset) * settings.volumeSensitivity)
				})
			}

			if (params.pitch) {
				paramFunctions.push(function () {
					synth.frequency.value = settings.baselinePitch + (curOffset * settings.pitchSensitivity)
				})
			}
		})

		$('.sidebar-item > input').on('change', function () {
			console.log(settings[$(this).attr('data-key')])
			settings[$(this).attr('data-key')] = parseInt($(this).val())
			console.log(settings[$(this).attr('data-key')])
		})

		synth.triggerAttack('C2', '8n')
		function adjustTone () {
			for (fn of paramFunctions) {
				fn()
			}
			window.requestAnimationFrame(adjustTone)
		}
		adjustTone()
	}

	function remToPx(rem) {
		return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
	}

	function restartCSSAnim(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = null;
	}

	$(window).one('click', generateAudio)
	const sidebarEl = $('.sidebar')
	$('.settings-icon').on('click', () => {
		if (sidebarEl.hasClass('active')) {
			sidebarEl.animate({
				right: -1 * sidebarEl.outerWidth()
			}, 300, function () {
				sidebarEl.toggleClass('active')
			})
		} else {
			sidebarEl.css('right', `${-1 * sidebarEl.outerWidth()}px`).toggleClass('active')
			sidebarEl.animate({
				right: 0
			}, 300)
		}
	})

	$('.mute-icon').on('click', function () {
		Tone.Master.mute = !Tone.Master.mute

		if (Tone.Master.mute) {
			$(this).html(`
				<g><path d="M278.4,219.89V42.31c0-16.39-19.37-25.09-31.62-14.2L162,103.48Z"/><path d="M66.15,188.66,6.38,241.8a19,19,0,0,0,0,28.4l240.4,213.69c12.25,10.89,31.62,2.19,31.62-14.2V400.91Z"/><path d="M384,448a31.9,31.9,0,0,1-22.63-9.37l-320-320A32,32,0,0,1,86.63,73.37l320,320A32,32,0,0,1,384,448Z"/></g>
			`)
		} else {
			$(this).html(`
				<g><path d="M346.51,378.51a32,32,0,0,1-22.63-54.63,96,96,0,0,0,0-135.76,32,32,0,0,1,45.26-45.26,160,160,0,0,1,0,226.28A31.94,31.94,0,0,1,346.51,378.51Z"/><path d="M414.39,446.39a32,32,0,0,1-22.63-54.63,192,192,0,0,0,0-271.52A32,32,0,0,1,437,75a256,256,0,0,1,0,362A31.9,31.9,0,0,1,414.39,446.39Z"/><path d="M278.4,42.31V469.69c0,16.39-19.37,25.09-31.62,14.2L6.38,270.2a19,19,0,0,1,0-28.4L246.78,28.11C259,17.22,278.4,25.92,278.4,42.31Z"/></g>
			`)
		}
	})

	resizeWindow()
	generateQRCode()
	runWhip()
})