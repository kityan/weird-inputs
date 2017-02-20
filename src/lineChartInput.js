;
(function () {

	// resize detector >
	function ResizeDetector(element, handler) {
		this.timeout = 50;
		this.tm = null;
		this.values = { w: null, h: null }
		this.element = element || window;
		this.handler = handler || function () { };
		this.tm = setTimeout(this.checker.bind(this), this.timeout);
		this.rnd = Math.random();
	}
	ResizeDetector.prototype.destroy = function () {
		clearTimeout(this.tm);
	}
	ResizeDetector.prototype.checker = function () {
		var w = parseInt(this.element.style('width'));
		var h = parseInt(this.element.style('height'));
		if ((this.values.w && this.values.w != w) || (this.values.h && this.values.h != h)) {
			setTimeout(this.handler.bind(this), 0);
		}
		this.values.w = w;
		this.values.h = h;
		this.tm = setTimeout(this.checker.bind(this), this.timeout);
	}
	// resize detector <


	var app = angular.module('weird-inputs', []);
	app.directive("lineChartInput", ['$window', '$filter', function ($window, $filter) {
		return {
			restrict: "EA",
			template: '<svg class="lineChartInputGraph" style="width:100%; height: 100%"></svg><svg class="lineChartInputPopup" viewBox="0 0 150 45"></svg>',

			scope: {
				points: '=',
				options: '=',
				activePoint: '=?'
			},

			link: function (scope, elem, attrs) {

				var popupSvgOffset = {
					x: 75,
					y: 60
				}

				var arrays;
				var paddings = { left: 80, right: 30, top: 30, bottom: 80 }
				elem.addClass('lineChartInput');
				var r = 3;
				var topFactor = 1.5;
				var bottomFactor = 0.5;
				var pathClass = "line";
				var xScale, yScale, yAxisGen, lineFun, drag, labelsPrecision, bottomLimit, yMax, yMin;
				var d3 = $window.d3;
				var svgs = elem.find('svg');
				var svg = d3.select(svgs[0]);
				var svgPopup = d3.select(svgs[1]);
				var svgWidth = parseInt(svg.style('width'));
				var svgHeight = parseInt(svg.style('height'));
				var topLabelDragLimiter = 10;
				var yStep;
				var popup, popupText;

				// выступы сетки, например для примыкания к осям
				var outGrid = {
					yLeft: 20,
					yRight: 20,
					xTop: 0,
					xBottom: 0,
				}

				var initilazed = false;

				/*
			  
				[+] доработать?
			  
				// http://stackoverflow.com/questions/17626555/responsive-d3-chart
				svg
				.attr("width", '100%')
				.attr("height", '100%')
				.attr('viewBox','0 0 '+Math.min(850,200)+' '+Math.min(850,200))
				.attr('preserveAspectRatio','xMinYMin')
				.append("g")
				.attr("transform", "translate(" + Math.min(850,200) / 2 + "," + Math.min(850,200) / 2 + ")");
				*/


				function onresize() {
					svgWidth = parseInt(svg.style('width'));
					svgHeight = parseInt(svg.style('height'));
					setChartParameters();
					svg.selectAll('*').remove();
					draw();
				}

				var r = new ResizeDetector(svg, onresize);
				scope.$on('$destroy', function () {
					r.destroy();
					// destroy d3 drag?		
				});

				function update() {
					if (!scope.options || !scope.points) { return; }
					if (!initilazed) {
						draw();
					} else {
						redraw();
					}
				}

				scope.$watch('points', update, true);
				scope.$watch('options', update, true);



				function setChartParameters() {

					xScale = d3.scale.linear()
						.domain([
							new Date(scope.points[0].dt),
							new Date(scope.points[scope.points.length - 1].dt)])
						.range([paddings.left, svgWidth - paddings.right]);

					yScale = d3.scale.linear()
						.domain([scope.options.min, scope.options.max])
						.range([svgHeight - paddings.bottom, paddings.top]);

					yStep = yScale(scope.options.max - scope.options.step) - yScale(scope.options.max);
					yMax = yScale(scope.options.max);
					yMin = yScale(scope.options.min);


					lineFun = d3.svg.line()
						.x(function (d, i) { return xScale(new Date(d.dt)); })
						.y(function (d) { return yScale(d.value); })
						.interpolate(scope.options.lineInterpolation);

					yAxisGen = d3.svg.axis()
						.scale(yScale)
						.orient("left")
						.tickValues([scope.options.min, scope.options.max])

					xAxisGen = d3.svg.axis()
						.scale(xScale)
						.orient("bottom")
						.tickValues(scope.points.map(function (el) { return el.dt; }))
						.tickFormat(function (d) { return new Date(d).getFullYear() });


					drag = d3.behavior.drag()
						.on('dragstart', dragstart)
						.on('drag', dragging)
						.on('dragend', dragend);

				}


				// перерисуем график
				function redraw() {

					svg.select("path.line")
						.attr({
							d: lineFun(scope.points)
						});

					svg.selectAll('circle.point')
						.data(scope.points)
						.attr('cy', function (d) { return yScale(d.value); });
				}


				// сетка (переделать на http://www.d3noob.org/2013/01/adding-grid-lines-to-d3js-graph.html ?)
				function drawGrid(yGrid, xGrid, hideGrid) {

					var grid = svg.append("svg:g").attr('class', 'grid');

					if (!hideGrid || !hideGrid.y) {
						for (var i = 0; i <= yGrid; i++) {
							var y = Math.round(i * (svgHeight - paddings.top - paddings.bottom) / (yGrid) + paddings.top);
							grid.append("svg:line")
								.attr('class', 'yGrid')
								.attr("x1", paddings.left - outGrid.yLeft)
								.attr("y1", y)
								.attr("x2", svgWidth - paddings.right + outGrid.yRight)
								.attr("y2", y)
						}
					}

					if (!hideGrid || !hideGrid.x) {
						var k = scope.points.length / xGrid;
						for (var i = 0; i < scope.points.length; i++) {
							if (i % k !== 0 && !(i == scope.points.length - 1)) { continue; }
							var x = Math.round(xScale(scope.points[i].dt));
							grid.append("svg:line")
								.attr('class', 'xGrid')
								.attr("x1", x)
								.attr("y1", paddings.top - outGrid.xTop)
								.attr("x2", x)
								.attr("y2", svgHeight - paddings.bottom + outGrid.xBottom)
						}
					}

				}


				function generateYTickValues() {
					var res = []
					for (var i = 1; i <= 3; i++) {
						res.push(i * scope.options.max);
					}
					return res
				}


				// отрисовка графика
				function draw() {

					setChartParameters();

					drawGrid(
						(scope.options.grid.y) ? scope.options.grid.y : 6,
						(scope.options.grid.x) ? scope.options.grid.x : 6,
						scope.options.hideGrid
					);

					svg.append("svg:g")
						.attr("class", "axis yAxis")
						.attr("transform", "translate(" + (paddings.left - outGrid.yLeft) + ", 0)")
						.call(yAxisGen);

					svg.append("svg:g")
						.attr("class", "axis xAxis")
						.attr("transform", "translate(0, " + (yMin - outGrid.xBottom) + ")")
						.call(xAxisGen);

					svg.append("svg:path")
						.attr({
							d: lineFun(scope.points),
							class: pathClass
						});


					svg.selectAll('circle.point')
						.data(scope.points)
						.enter()
						.append('svg:circle')
						.attr('class', function (d, i) { return 'point' + (d.readonly ? ' readonly' : ''); })
						.attr('id', function (d, i) { return 'circle_' + i; })
						.attr('cx', function (d) { return xScale(new Date(d.dt)); })
						.attr('cy', function (d) { return yScale(d.value); })
						.attr('r', function (d, i) { return (d.readonly ? 3 : 10); })
						.call(drag);



					popup =
						svgPopup.append('svg:g')
							.attr('class', 'popup');

					popup
						.append('svg:path')
						.attr('d', 'M 0,0 0,30 60,30 75,44 90,30 150,30 150,0 0,0 Z');

					// :-E
					// где текст в MISE, если transform задан через CSS?
					// почему текст ползёт при изменении мастшаба окна, если transform задан через CSS? в хроме, но не в фоксе!
					popupText =
						popup.append('svg:text')
							.attr('transform', 'translate(75, 20)')
							.text('');

					initilazed = true;

				}

				function dragstart() {

					var t = d3.select(d3.event.sourceEvent.target);

					if (!t.classed('readonly')) {
						svg.classed('whileDragging', true);
					}

					var mX = t.attr('cx');
					var mY = t.attr('cy');

					var v = (yScale.invert(mY)).toFixed(scope.options.precision);

					scope.$apply(function () {
						scope.activePoint = {
							index: t.attr('id').replace('circle_', '') * 1,
							value: v * 1
						}
					});

					popupText.text(v);

					if (!scope.options.hidePopup) {
						svgPopup
							.style('display', 'block')
							.style('transform', 'translate(' + (mX - popupSvgOffset.x) + 'px,' + (mY - popupSvgOffset.y) + 'px)')
							.style('-webkit-transform', 'translate(' + (mX - popupSvgOffset.x) + 'px,' + (mY - popupSvgOffset.y) + 'px)');

					}

					var el = d3.select(this);
					var params = el.attr('id').split("_");

				}

				function dragging() {

					var y = d3.event.y;
					var x = d3.event.x;

					var el = d3.select(this);

					if (el.classed('readonly')) { return; }

					var cy = el.attr('cy') * 1;
					var cx = el.attr('cx') * 1;

					// шаг
					y = cy + Math.round((y - cy) / yStep) * yStep;

					y = (y < yMax) ? yMax : y;
					y = (y > yMin) ? yMin : y;

					var params = el.attr('id').split("_");

					scope.$apply(function () {
						var v = (yScale.invert(y)).toFixed(scope.options.precision);
						scope.points[params[1] * 1].value = v * 1;
						redraw();

						scope.activePoint = {
							index: el.attr('id').replace('circle_', '') * 1,
							value: v * 1
						}

						if (!scope.options.hidePopup) {
							svgPopup.style('transform', 'translate(' + (cx - popupSvgOffset.x) + 'px,' + (cy - popupSvgOffset.y) + 'px)');
							svgPopup.style('-webkit-transform', 'translate(' + (cx - popupSvgOffset.x) + 'px,' + (cy - popupSvgOffset.y) + 'px)');

						}

						popupText.text(v);

					});

				}


				function dragend() {

					svg.classed('whileDragging', false);

					scope.$apply(function () {
						scope.activePoint = null;
					});

					if (!scope.options.hidePopup) {
						svgPopup.style('display', 'none');
					}

					var el = d3.select(this);
					var params = el.attr('id').split("_");
				}



			}
		};
	}]);

})();