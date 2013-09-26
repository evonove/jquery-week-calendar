(function(TimelyUi) { 'use strict';
	TimelyUi.compat = TimelyUi.compat || {};
	TimelyUi.compat.events = TimelyUi.compat.events || {};
	TimelyUi.compat.mouse = {
		click: 'click',
		down: 'mousedown',
		move : 'mousemove',
		cancel : 'mousecancel',
		up : 'mouseup',
		over: 'mouseover',
		out: 'mouseout',
		drag: 'mousemove',
		hold: 'mousedown'
	};
	TimelyUi.compat.touch = {
		click: 'tap',
		down: 'touchstart',
		move : 'touchmove',
		cancel : 'touchcancel',
		up : 'touchend',
		over: 'drag',
		out: 'release',
		drag: 'drag',
		hold: 'hold'
	};

	TimelyUi.compat.on = function(el, name, callback){
        var self = TimelyUi.compat,
		    $el = el.nodeType ? $(el) : el.jquery ? el : $(document.querySelector(el));

		if ((self.isMobile || self.isTablet) && name.length === 0){
			return;
		}

		if ((self.isMobile || self.isTablet) && name.indexOf('touch') === -1){
			$el = $el.hammer();
			return $el.on(name,callback);
		}

		$el.each(function(index, element) {
			element.addEventListener(name, callback, false);
		});
		return $el;
	};

	TimelyUi.compat.off = function(el, name, callback){
		var self = TimelyUi.compat,
		    $el = el.nodeType ? $(el) : el.jquery ? el : $(document.querySelector(el));

		if ((self.isMobile || self.isTablet) && name.indexOf('touch') === -1){
			$el = $el.hammer();
			return $el.off(name,callback);
		}
		$el.each(function(index, element) {
			element.removeEventListener(name, callback, false);
		});
		return $el;
	};
})(TimelyUi);

(function(TimelyUi) { 'use strict';
    var self = TimelyUi.compat,
        _userAgent = navigator.userAgent.toLowerCase(),
        _vendor = navigator.vendor.toLowerCase(),
        _mobileAgent = (/android|webos|iphone|ipod|blackberry|kindle|opera mini/i.test(_userAgent)),
        _mobileDevice = (/mobile/i.test(_userAgent));

    // Find device informations (it's not reliable but there aren't other choices)
    self.isMobile = _mobileAgent && _mobileDevice;
    self.isTablet = (/ipad/i.test(_userAgent)) || (_mobileAgent && !_mobileDevice);
    self.isSafariWebKit = (/safari/i.test(_userAgent) && /apple computer/i.test(_vendor));

    // Set events handler according to device type
    self.events = self.isMobile || self.isTablet ? self.touch : self.mouse;
})(TimelyUi);
