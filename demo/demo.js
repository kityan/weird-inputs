var app = angular.module('weirdInputsDemo', ['weird-inputs']);
app.controller('MainCtrl', ['$scope', function ($scope) {


	var prices = [
		1200,
		1200, 1200, 1250, 1300, 1300,
		1250, 1250, 1200, 1200, 1200,
		1200
	];

	var rates = [
		1.3,
		1.3, 1.3, 1.35, 1.4, 1.35,
		1.3, 1.3, 1.4, 1.5, 1.4,
		1.4
	];


	var startYear = 2016;

	var readOnlyYears = [2016, 2027];

	function mapFunction(el, i) {
		return {
			dt: createDate(startYear + i),
			value: el,
			readonly: (readOnlyYears.indexOf(startYear + i) >= 0)
		}
	}

	function createDate(year) {
		return new Date(year + '-01-01T00:00:00Z')
	}


	$scope.pricesData = {
		points: prices.map(mapFunction),
		options: {
			step: 10,
			precision: 0,
			lineInterpolation: 'monotone',
			max: 1300,
			min: 1100,
			grid: { x: 12, y: 4 },
			hideGrid: { x: true },
			level: 1200 // указание определённого уровня (например, при хеджировании)
		}
	};

	$scope.ratesData = {
		points: rates.map(mapFunction),
		options: {
			hidePopup: true,
			step: 0.01,
			precision: 2,
			lineInterpolation: 'linear',
			max: 1.5,
			min: 1.1,
			grid: { x: 12, y: 10 },
			shortYearLabels: true
		}
	};

}]);


app.filter('extractValues', function () {
	return function (input) {
		return input.points.map(function (el) {
			return el.value;
		});
	}
})

