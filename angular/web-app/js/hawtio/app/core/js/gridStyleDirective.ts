module Core {

  export class GridStyle {
    public restrict = 'C';

    public link:(scope, element, attrs) => any;

    constructor (public $window) {
      // necessary to ensure 'this' is this object <sigh>
      this.link = (scope, element, attrs) => {
        return this.doLink(scope, element, attrs);
      }
    }

    private doLink(scope, element, attrs) {

      var lastHeight = 0;

      var resizeFunc = angular.bind(this, function(scope) {

        var top = element.position().top;
        var windowHeight = $(this.$window).height();
        var height = windowHeight - top - 15;
        var heightStr = height + 'px';

        element.css({
          'min-height': heightStr,
          'height': heightStr
        });

        if (lastHeight !== height) {
          lastHeight = height;
          element.trigger('resize');
        }

      });

      resizeFunc();

      scope.$watch(resizeFunc);

      $(this.$window).resize(function() {
        resizeFunc();
        Core.$apply(scope);
        return false;
      });
    }

  }

}
