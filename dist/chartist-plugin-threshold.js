(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(["chartist"], function (Chartist) {
      return (root.returnExportsGlobal = factory(Chartist));
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory(require("chartist"));
  } else {
    root['Chartist.plugins.ctThreshold'] = factory(Chartist);
  }
}(this, function (Chartist) {

  /**
   * Chartist.js plugin to divide your Line or Bar chart with a threshold.
   *
   */
  /* global Chartist */
  (function (window, document, Chartist) {
    'use strict';

    var defaultOptions = {
      threshold: 0,
      showIndicator: false,
      classNames: {
        aboveThreshold: 'ct-threshold-above',
        belowThreshold: 'ct-threshold-below'
      },
      maskNames: {
        aboveThreshold: 'ct-threshold-mask-above',
        belowThreshold: 'ct-threshold-mask-below'
      }
    };

    function createMasks(data, options) {
      // Select the defs element within the chart or create a new one
      var defs = data.svg.querySelector('defs') || data.svg.elem('defs');
      var width = data.svg.width();
      var height = data.svg.height();
      var projectedThreshold, aboveRect, belowRect;

      if (!data.options.horizontalBars) {
        // Project the threshold value on the chart Y axis
        projectedThreshold =
          data.chartRect.height() -
          data.axisY.projectValue(options.threshold) +
          data.chartRect.y2;

        aboveRect = {
          x: 0,
          y: 0,
          width: width,
          height: projectedThreshold,
          fill: 'white'
        };

        belowRect = {
          x: 0,
          y: projectedThreshold,
          width: width,
          height: height - projectedThreshold,
          fill: 'white'
        };
      } else {
        // Project the threshold value on the chart X axis
        projectedThreshold =
          data.axisX.projectValue(options.threshold) +
          data.chartRect.x1;

        aboveRect = {
          x: projectedThreshold,
          y: 0,
          width: width - projectedThreshold,
          height: height,
          fill: 'white'
        };

        belowRect = {
          x: 0,
          y: 0,
          width: projectedThreshold,
          height: height,
          fill: 'white'
        };
      }

      // Create mask for upper part above threshold
      defs
        .elem('mask', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          maskUnits: 'userSpaceOnUse',
          id: options.maskNames.aboveThresholdID
        })
        .elem('rect', aboveRect);

      // Create mask for lower part below threshold
      defs
        .elem('mask', {
          x: 0,
          y: 0,
          width: width,
          height: height,
          maskUnits: 'userSpaceOnUse',
          id: options.maskNames.belowThresholdID
        })
        .elem('rect', belowRect);

      // Show a line indicator and label where the threshold is
      if (options.showIndicator) {
        // Select the group element within the chart or create a new one
        var group = data.svg.querySelector('g.ct-indicator') || data.svg.elem('g').addClass('ct-indicator');
        var textX, textY, line;

        // Project the threshold values for the line and label
        if (data.options.horizontalBars) {
          textX = projectedThreshold;
          textY = 10;
          line = {
            x1: projectedThreshold,
            x2: projectedThreshold,
            y1: 0,
            y2: height,
          };
        } else {
          textX = 10;
          textY = projectedThreshold;
          line = {
            x1: 0,
            x2: width,
            y1: projectedThreshold,
            y2: projectedThreshold,
          };
        }

        group
          .elem('text', {
            x: textX,
            y: textY,
            style: 'text-anchor: middle',
          }, 'ct-label ct-value-label')
          .text(options.threshold);

        group
          .elem('line',
            line,
            'ct-grid ct-horizontal'
          );
      }

      return defs;
    }

    Chartist.plugins = Chartist.plugins || {};
    Chartist.plugins.ctThreshold = function (options) {

      options = Chartist.extend({}, defaultOptions, options);

      // Ensure mask names are unique
      options.maskNames.aboveThresholdID = options.maskNames.aboveThreshold + '-' + Math.random().toString(36).substr(2, 9);
      options.maskNames.belowThresholdID = options.maskNames.belowThreshold + '-' + Math.random().toString(36).substr(2, 9);

      return function ctThreshold(chart) {
        if (chart instanceof Chartist.Line || chart instanceof Chartist.Bar) {
          chart.on('draw', function (data) {
            if (data.type === 'point') {
              // For points we can just use the data value and compare against the threshold in order to determine
              // the appropriate class
              data.element.addClass(
                data.value.y >= options.threshold ? options.classNames.aboveThreshold : options.classNames.belowThreshold
              );
            } else if (
              data.type === 'line' ||
              data.type === 'bar' ||
              data.type === 'area'
            ) {
              // Cloning the original line path, mask it with the upper mask rect above the threshold and add the
              // class for above threshold
              data.element
                .parent()
                .elem(data.element._node.cloneNode(true))
                .attr({
                  mask: 'url(#' + options.maskNames.aboveThresholdID + ')'
                })
                .addClass(options.classNames.aboveThreshold);

              // Use the original line path, mask it with the lower mask rect below the threshold and add the class
              // for blow threshold
              data.element
                .attr({
                  mask: 'url(#' + options.maskNames.belowThresholdID + ')'
                })
                .addClass(options.classNames.belowThreshold);
            }
          });

          // On the created event, create the two mask definitions used to mask the line graphs
          chart.on('created', function (data) {
            createMasks(data, options);
          });
        }
      };
    };
  }(window, document, Chartist));

  return Chartist.plugins.ctThreshold;

}));
