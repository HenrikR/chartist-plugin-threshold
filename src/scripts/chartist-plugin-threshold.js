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

    // Ensure no width, height, x or y values are negative values, as they are invalid
    if (aboveRect.x < 0) {
      aboveRect.x = 0;
    }
    if (aboveRect.y < 0) {
      aboveRect.y = 0;
    }
    if (aboveRect.width < 0) {
      aboveRect.width = 0;
    }
    if (aboveRect.height < 0) {
      aboveRect.height = 0;
    }
    if (belowRect.x < 0) {
      belowRect.x = 0;
    }
    if (belowRect.y < 0) {
      belowRect.y = 0;
    }
    if (belowRect.width < 0) {
      belowRect.width = 0;
    }
    if (belowRect.height < 0) {
      belowRect.height = 0;
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
            // Ensure the cloned path is added as the first element of the parent node
            // Ref for `elem()`: https://github.com/gionkunz/chartist-js/blob/master/src/scripts/svg.js#L94
            data.element
              .parent()
              .elem(data.element._node.cloneNode(true), {}, '', true)
              .attr({
                mask: 'url(#' + options.maskNames.aboveThresholdID + ')'
              })
              .addClass(options.classNames.aboveThreshold);

            // Use the original line path, mask it with the lower mask rect below the threshold and add the class
            // for below threshold
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
