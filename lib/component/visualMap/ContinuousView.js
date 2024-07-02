
/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


/**
 * AUTO-GENERATED FILE. DO NOT MODIFY.
 */

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
import * as zrUtil from 'zrender/lib/core/util.js';
import LinearGradient from 'zrender/lib/graphic/LinearGradient.js';
import * as eventTool from 'zrender/lib/core/event.js';
import VisualMapView from './VisualMapView.js';
import * as graphic from '../../util/graphic.js';
import * as numberUtil from '../../util/number.js';
import sliderMove from '../helper/sliderMove.js';
import * as helper from './helper.js';
import * as modelUtil from '../../util/model.js';
import { parsePercent } from 'zrender/lib/contain/text.js';
import { setAsHighDownDispatcher } from '../../util/states.js';
import { createSymbol } from '../../util/symbol.js';
import ZRImage from 'zrender/lib/graphic/Image.js';
import { getECData } from '../../util/innerStore.js';
import { createTextStyle } from '../../label/labelStyle.js';
import { findEventDispatcher } from '../../util/event.js';
const linearMap = numberUtil.linearMap;
const each = zrUtil.each;
const mathMin = Math.min;
const mathMax = Math.max;
// Arbitrary value
const HOVER_LINK_SIZE = 12;
const HOVER_LINK_OUT = 6;
// Notice:
// Any "interval" should be by the order of [low, high].
// "handle0" (handleIndex === 0) maps to
// low data value: this._dataInterval[0] and has low coord.
// "handle1" (handleIndex === 1) maps to
// high data value: this._dataInterval[1] and has high coord.
// The logic of transform is implemented in this._createBarGroup.
class ContinuousView extends VisualMapView {
  constructor() {
    super(...arguments);
    this.type = ContinuousView.type;
    this._shapes = {};
    this._dataInterval = [];
    this._handleEnds = [];
    this._hoverLinkDataIndices = [];
  }
  init(ecModel, api) {
    super.init(ecModel, api);
    this._hoverLinkFromSeriesMouseOver = zrUtil.bind(this._hoverLinkFromSeriesMouseOver, this);
    this._hideIndicator = zrUtil.bind(this._hideIndicator, this);
  }
  doRender(visualMapModel, ecModel, api, payload) {
    if (!payload || payload.type !== 'selectDataRange' || payload.from !== this.uid) {
      this._buildView();
    }
  }
  _buildView() {
    this.group.removeAll();
    const visualMapModel = this.visualMapModel;
    const thisGroup = this.group;
    this._orient = visualMapModel.get('orient');
    this._useHandle = visualMapModel.get('calculable');
    this._resetInterval();
    this._renderBar(thisGroup);
    const dataRangeText = visualMapModel.get('text');
    this._renderEndsText(thisGroup, dataRangeText, 0);
    this._renderEndsText(thisGroup, dataRangeText, 1);
    // Do this for background size calculation.
    this._updateView(true);
    // After updating view, inner shapes is built completely,
    // and then background can be rendered.
    this.renderBackground(thisGroup);
    // Real update view
    this._updateView();
    this._enableHoverLinkToSeries();
    this._enableHoverLinkFromSeries();
    this.positionGroup(thisGroup);
  }
  _renderEndsText(group, dataRangeText, endsIndex) {
    if (!dataRangeText) {
      return;
    }
    // Compatible with ec2, text[0] map to high value, text[1] map low value.
    let text = dataRangeText[1 - endsIndex];
    text = text != null ? text + '' : '';
    const visualMapModel = this.visualMapModel;
    const textGap = visualMapModel.get('textGap');
    const itemSize = visualMapModel.itemSize;
    const barGroup = this._shapes.mainGroup;
    const position = this._applyTransform([itemSize[0] / 2, endsIndex === 0 ? -textGap : itemSize[1] + textGap], barGroup);
    const align = this._applyTransform(endsIndex === 0 ? 'bottom' : 'top', barGroup);
    const orient = this._orient;
    const textStyleModel = this.visualMapModel.textStyleModel;
    this.group.add(new graphic.Text({
      style: createTextStyle(textStyleModel, {
        x: position[0],
        y: position[1],
        verticalAlign: orient === 'horizontal' ? 'middle' : align,
        align: orient === 'horizontal' ? align : 'center',
        text
      })
    }));
  }
  _renderBar(targetGroup) {
    const visualMapModel = this.visualMapModel;
    const shapes = this._shapes;
    const itemSize = visualMapModel.itemSize;
    const orient = this._orient;
    const useHandle = this._useHandle;
    const itemAlign = helper.getItemAlign(visualMapModel, this.api, itemSize);
    const mainGroup = shapes.mainGroup = this._createBarGroup(itemAlign);
    const gradientBarGroup = new graphic.Group();
    mainGroup.add(gradientBarGroup);
    // Bar
    gradientBarGroup.add(shapes.outOfRange = createPolygon());
    gradientBarGroup.add(shapes.inRange = createPolygon(null, useHandle ? getCursor(this._orient) : null, zrUtil.bind(this._dragHandle, this, 'all', false), zrUtil.bind(this._dragHandle, this, 'all', true)));
    // A border radius clip.
    gradientBarGroup.setClipPath(new graphic.Rect({
      shape: {
        x: 0,
        y: 0,
        width: itemSize[0],
        height: itemSize[1],
        r: 3
      }
    }));
    const textRect = visualMapModel.textStyleModel.getTextRect('国');
    const textSize = mathMax(textRect.width, textRect.height);
    // Handle
    if (useHandle) {
      shapes.handleThumbs = [];
      shapes.handleLabels = [];
      shapes.handleLabelPoints = [];
      this._createHandle(visualMapModel, mainGroup, 0, itemSize, textSize, orient);
      this._createHandle(visualMapModel, mainGroup, 1, itemSize, textSize, orient);
    }
    this._createIndicator(visualMapModel, mainGroup, itemSize, textSize, orient);
    targetGroup.add(mainGroup);
  }
  _createHandle(visualMapModel, mainGroup, handleIndex, itemSize, textSize, orient) {
    const onDrift = zrUtil.bind(this._dragHandle, this, handleIndex, false);
    const onDragEnd = zrUtil.bind(this._dragHandle, this, handleIndex, true);
    const handleSize = parsePercent(visualMapModel.get('handleSize'), itemSize[0]);
    const handleThumb = createSymbol(visualMapModel.get('handleIcon'), -handleSize / 2, -handleSize / 2, handleSize, handleSize, null, true);
    const cursor = getCursor(this._orient);
    handleThumb.attr({
      cursor: cursor,
      draggable: true,
      drift: onDrift,
      ondragend: onDragEnd,
      onmousemove(e) {
        eventTool.stop(e.event);
      }
    });
    handleThumb.x = itemSize[0] / 2;
    handleThumb.useStyle(visualMapModel.getModel('handleStyle').getItemStyle());
    handleThumb.setStyle({
      strokeNoScale: true,
      strokeFirst: true
    });
    handleThumb.style.lineWidth *= 2;
    handleThumb.ensureState('emphasis').style = visualMapModel.getModel(['emphasis', 'handleStyle']).getItemStyle();
    setAsHighDownDispatcher(handleThumb, true);
    mainGroup.add(handleThumb);
    // Text is always horizontal layout but should not be effected by
    // transform (orient/inverse). So label is built separately but not
    // use zrender/graphic/helper/RectText, and is located based on view
    // group (according to handleLabelPoint) but not barGroup.
    const textStyleModel = this.visualMapModel.textStyleModel;
    const handleLabel = new graphic.Text({
      cursor: cursor,
      draggable: true,
      drift: onDrift,
      onmousemove(e) {
        // For mobile device, prevent screen slider on the button.
        eventTool.stop(e.event);
      },
      ondragend: onDragEnd,
      style: createTextStyle(textStyleModel, {
        x: 0,
        y: 0,
        text: ''
      })
    });
    handleLabel.ensureState('blur').style = {
      opacity: 0.1
    };
    handleLabel.stateTransition = {
      duration: 200
    };
    this.group.add(handleLabel);
    const handleLabelPoint = [handleSize, 0];
    const shapes = this._shapes;
    shapes.handleThumbs[handleIndex] = handleThumb;
    shapes.handleLabelPoints[handleIndex] = handleLabelPoint;
    shapes.handleLabels[handleIndex] = handleLabel;
  }
  _createIndicator(visualMapModel, mainGroup, itemSize, textSize, orient) {
    const scale = parsePercent(visualMapModel.get('indicatorSize'), itemSize[0]);
    const indicator = createSymbol(visualMapModel.get('indicatorIcon'), -scale / 2, -scale / 2, scale, scale, null, true);
    indicator.attr({
      cursor: 'move',
      invisible: true,
      silent: true,
      x: itemSize[0] / 2
    });
    const indicatorStyle = visualMapModel.getModel('indicatorStyle').getItemStyle();
    if (indicator instanceof ZRImage) {
      const pathStyle = indicator.style;
      indicator.useStyle(zrUtil.extend({
        // TODO other properties like x, y ?
        image: pathStyle.image,
        x: pathStyle.x,
        y: pathStyle.y,
        width: pathStyle.width,
        height: pathStyle.height
      }, indicatorStyle));
    } else {
      indicator.useStyle(indicatorStyle);
    }
    mainGroup.add(indicator);
    const textStyleModel = this.visualMapModel.textStyleModel;
    const indicatorLabel = new graphic.Text({
      silent: true,
      invisible: true,
      style: createTextStyle(textStyleModel, {
        x: 0,
        y: 0,
        text: ''
      })
    });
    this.group.add(indicatorLabel);
    const indicatorLabelPoint = [(orient === 'horizontal' ? textSize / 2 : HOVER_LINK_OUT) + itemSize[0] / 2, 0];
    const shapes = this._shapes;
    shapes.indicator = indicator;
    shapes.indicatorLabel = indicatorLabel;
    shapes.indicatorLabelPoint = indicatorLabelPoint;
    this._firstShowIndicator = true;
  }
  _dragHandle(handleIndex, isEnd,
  // dx is event from ondragend if isEnd is true. It's not used
  dx, dy) {
    if (!this._useHandle) {
      return;
    }
    this._dragging = !isEnd;
    if (!isEnd) {
      // Transform dx, dy to bar coordination.
      const vertex = this._applyTransform([dx, dy], this._shapes.mainGroup, true);
      this._updateInterval(handleIndex, vertex[1]);
      this._hideIndicator();
      // Considering realtime, update view should be executed
      // before dispatch action.
      this._updateView();
    }
    // dragEnd do not dispatch action when realtime.
    if (isEnd === !this.visualMapModel.get('realtime')) {
      // jshint ignore:line
      this.api.dispatchAction({
        type: 'selectDataRange',
        from: this.uid,
        visualMapId: this.visualMapModel.id,
        selected: this._dataInterval.slice()
      });
    }
    if (isEnd) {
      !this._hovering && this._clearHoverLinkToSeries();
    } else if (useHoverLinkOnHandle(this.visualMapModel)) {
      this._doHoverLinkToSeries(this._handleEnds[handleIndex], false);
    }
  }
  _resetInterval() {
    const visualMapModel = this.visualMapModel;
    const dataInterval = this._dataInterval = visualMapModel.getSelected();
    const dataExtent = visualMapModel.getExtent();
    const sizeExtent = [0, visualMapModel.itemSize[1]];
    this._handleEnds = [linearMap(dataInterval[0], dataExtent, sizeExtent, true), linearMap(dataInterval[1], dataExtent, sizeExtent, true)];
  }
  /**
   * @private
   * @param {(number|string)} handleIndex 0 or 1 or 'all'
   * @param {number} dx
   * @param {number} dy
   */
  _updateInterval(handleIndex, delta) {
    delta = delta || 0;
    const visualMapModel = this.visualMapModel;
    const handleEnds = this._handleEnds;
    const sizeExtent = [0, visualMapModel.itemSize[1]];
    sliderMove(delta, handleEnds, sizeExtent, handleIndex,
    // cross is forbidden
    0);
    const dataExtent = visualMapModel.getExtent();
    // Update data interval.
    this._dataInterval = [linearMap(handleEnds[0], sizeExtent, dataExtent, true), linearMap(handleEnds[1], sizeExtent, dataExtent, true)];
  }
  _updateView(forSketch) {
    const visualMapModel = this.visualMapModel;
    const dataExtent = visualMapModel.getExtent();
    const shapes = this._shapes;
    const outOfRangeHandleEnds = [0, visualMapModel.itemSize[1]];
    const inRangeHandleEnds = forSketch ? outOfRangeHandleEnds : this._handleEnds;
    const visualInRange = this._createBarVisual(this._dataInterval, dataExtent, inRangeHandleEnds, 'inRange');
    const visualOutOfRange = this._createBarVisual(dataExtent, dataExtent, outOfRangeHandleEnds, 'outOfRange');
    shapes.inRange.setStyle({
      fill: visualInRange.barColor
      // opacity: visualInRange.opacity
    }).setShape('points', visualInRange.barPoints);
    shapes.outOfRange.setStyle({
      fill: visualOutOfRange.barColor
      // opacity: visualOutOfRange.opacity
    }).setShape('points', visualOutOfRange.barPoints);
    this._updateHandle(inRangeHandleEnds, visualInRange);
  }
  _createBarVisual(dataInterval, dataExtent, handleEnds, forceState) {
    const opts = {
      forceState: forceState,
      convertOpacityToAlpha: true
    };
    const colorStops = this._makeColorGradient(dataInterval, opts);
    const symbolSizes = [this.getControllerVisual(dataInterval[0], 'symbolSize', opts), this.getControllerVisual(dataInterval[1], 'symbolSize', opts)];
    const barPoints = this._createBarPoints(handleEnds, symbolSizes);
    return {
      barColor: new LinearGradient(0, 0, 0, 1, colorStops),
      barPoints: barPoints,
      handlesColor: [colorStops[0].color, colorStops[colorStops.length - 1].color]
    };
  }
  _makeColorGradient(dataInterval, opts) {
    // Considering colorHue, which is not linear, so we have to sample
    // to calculate gradient color stops, but not only calculate head
    // and tail.
    const sampleNumber = 100; // Arbitrary value.
    const colorStops = [];
    const step = (dataInterval[1] - dataInterval[0]) / sampleNumber;
    colorStops.push({
      color: this.getControllerVisual(dataInterval[0], 'color', opts),
      offset: 0
    });
    for (let i = 1; i < sampleNumber; i++) {
      const currValue = dataInterval[0] + step * i;
      if (currValue > dataInterval[1]) {
        break;
      }
      colorStops.push({
        color: this.getControllerVisual(currValue, 'color', opts),
        offset: i / sampleNumber
      });
    }
    colorStops.push({
      color: this.getControllerVisual(dataInterval[1], 'color', opts),
      offset: 1
    });
    return colorStops;
  }
  _createBarPoints(handleEnds, symbolSizes) {
    const itemSize = this.visualMapModel.itemSize;
    return [[itemSize[0] - symbolSizes[0], handleEnds[0]], [itemSize[0], handleEnds[0]], [itemSize[0], handleEnds[1]], [itemSize[0] - symbolSizes[1], handleEnds[1]]];
  }
  _createBarGroup(itemAlign) {
    const orient = this._orient;
    const inverse = this.visualMapModel.get('inverse');
    return new graphic.Group(orient === 'horizontal' && !inverse ? {
      scaleX: itemAlign === 'bottom' ? 1 : -1,
      rotation: Math.PI / 2
    } : orient === 'horizontal' && inverse ? {
      scaleX: itemAlign === 'bottom' ? -1 : 1,
      rotation: -Math.PI / 2
    } : orient === 'vertical' && !inverse ? {
      scaleX: itemAlign === 'left' ? 1 : -1,
      scaleY: -1
    } : {
      scaleX: itemAlign === 'left' ? 1 : -1
    });
  }
  _updateHandle(handleEnds, visualInRange) {
    if (!this._useHandle) {
      return;
    }
    const shapes = this._shapes;
    const visualMapModel = this.visualMapModel;
    const handleThumbs = shapes.handleThumbs;
    const handleLabels = shapes.handleLabels;
    const itemSize = visualMapModel.itemSize;
    const dataExtent = visualMapModel.getExtent();
    each([0, 1], function (handleIndex) {
      const handleThumb = handleThumbs[handleIndex];
      handleThumb.setStyle('fill', visualInRange.handlesColor[handleIndex]);
      handleThumb.y = handleEnds[handleIndex];
      const val = linearMap(handleEnds[handleIndex], [0, itemSize[1]], dataExtent, true);
      const symbolSize = this.getControllerVisual(val, 'symbolSize');
      handleThumb.scaleX = handleThumb.scaleY = symbolSize / itemSize[0];
      handleThumb.x = itemSize[0] - symbolSize / 2;
      // Update handle label position.
      const textPoint = graphic.applyTransform(shapes.handleLabelPoints[handleIndex], graphic.getTransform(handleThumb, this.group));
      handleLabels[handleIndex].setStyle({
        x: textPoint[0],
        y: textPoint[1],
        text: visualMapModel.formatValueText(this._dataInterval[handleIndex]),
        verticalAlign: 'middle',
        align: this._orient === 'vertical' ? this._applyTransform('left', shapes.mainGroup) : 'center'
      });
    }, this);
  }
  _showIndicator(cursorValue, textValue, rangeSymbol, halfHoverLinkSize) {
    const visualMapModel = this.visualMapModel;
    const dataExtent = visualMapModel.getExtent();
    const itemSize = visualMapModel.itemSize;
    const sizeExtent = [0, itemSize[1]];
    const shapes = this._shapes;
    const indicator = shapes.indicator;
    if (!indicator) {
      return;
    }
    indicator.attr('invisible', false);
    const opts = {
      convertOpacityToAlpha: true
    };
    const color = this.getControllerVisual(cursorValue, 'color', opts);
    const symbolSize = this.getControllerVisual(cursorValue, 'symbolSize');
    const y = linearMap(cursorValue, dataExtent, sizeExtent, true);
    const x = itemSize[0] - symbolSize / 2;
    const oldIndicatorPos = {
      x: indicator.x,
      y: indicator.y
    };
    // Update handle label position.
    indicator.y = y;
    indicator.x = x;
    const textPoint = graphic.applyTransform(shapes.indicatorLabelPoint, graphic.getTransform(indicator, this.group));
    const indicatorLabel = shapes.indicatorLabel;
    indicatorLabel.attr('invisible', false);
    const align = this._applyTransform('left', shapes.mainGroup);
    const orient = this._orient;
    const isHorizontal = orient === 'horizontal';
    indicatorLabel.setStyle({
      text: (rangeSymbol ? rangeSymbol : '') + visualMapModel.formatValueText(textValue),
      verticalAlign: isHorizontal ? align : 'middle',
      align: isHorizontal ? 'center' : align
    });
    const indicatorNewProps = {
      x: x,
      y: y,
      style: {
        fill: color
      }
    };
    const labelNewProps = {
      style: {
        x: textPoint[0],
        y: textPoint[1]
      }
    };
    if (visualMapModel.ecModel.isAnimationEnabled() && !this._firstShowIndicator) {
      const animationCfg = {
        duration: 100,
        easing: 'cubicInOut',
        additive: true
      };
      indicator.x = oldIndicatorPos.x;
      indicator.y = oldIndicatorPos.y;
      indicator.animateTo(indicatorNewProps, animationCfg);
      indicatorLabel.animateTo(labelNewProps, animationCfg);
    } else {
      indicator.attr(indicatorNewProps);
      indicatorLabel.attr(labelNewProps);
    }
    this._firstShowIndicator = false;
    const handleLabels = this._shapes.handleLabels;
    if (handleLabels) {
      for (let i = 0; i < handleLabels.length; i++) {
        // Fade out handle labels.
        // NOTE: Must use api enter/leave on emphasis/blur/select state. Or the global states manager will change it.
        this.api.enterBlur(handleLabels[i]);
      }
    }
  }
  _enableHoverLinkToSeries() {
    const self = this;
    this._shapes.mainGroup.on('mousemove', function (e) {
      self._hovering = true;
      if (!self._dragging) {
        const itemSize = self.visualMapModel.itemSize;
        const pos = self._applyTransform([e.offsetX, e.offsetY], self._shapes.mainGroup, true, true);
        // For hover link show when hover handle, which might be
        // below or upper than sizeExtent.
        pos[1] = mathMin(mathMax(0, pos[1]), itemSize[1]);
        self._doHoverLinkToSeries(pos[1], 0 <= pos[0] && pos[0] <= itemSize[0]);
      }
    }).on('mouseout', function () {
      // When mouse is out of handle, hoverLink still need
      // to be displayed when realtime is set as false.
      self._hovering = false;
      !self._dragging && self._clearHoverLinkToSeries();
    });
  }
  _enableHoverLinkFromSeries() {
    const zr = this.api.getZr();
    if (this.visualMapModel.option.hoverLink) {
      zr.on('mouseover', this._hoverLinkFromSeriesMouseOver, this);
      zr.on('mouseout', this._hideIndicator, this);
    } else {
      this._clearHoverLinkFromSeries();
    }
  }
  _doHoverLinkToSeries(cursorPos, hoverOnBar) {
    const visualMapModel = this.visualMapModel;
    const itemSize = visualMapModel.itemSize;
    if (!visualMapModel.option.hoverLink) {
      return;
    }
    const sizeExtent = [0, itemSize[1]];
    const dataExtent = visualMapModel.getExtent();
    // For hover link show when hover handle, which might be below or upper than sizeExtent.
    cursorPos = mathMin(mathMax(sizeExtent[0], cursorPos), sizeExtent[1]);
    const halfHoverLinkSize = getHalfHoverLinkSize(visualMapModel, dataExtent, sizeExtent);
    const hoverRange = [cursorPos - halfHoverLinkSize, cursorPos + halfHoverLinkSize];
    const cursorValue = linearMap(cursorPos, sizeExtent, dataExtent, true);
    const valueRange = [linearMap(hoverRange[0], sizeExtent, dataExtent, true), linearMap(hoverRange[1], sizeExtent, dataExtent, true)];
    // Consider data range is out of visualMap range, see test/visualMap-continuous.html,
    // where china and india has very large population.
    hoverRange[0] < sizeExtent[0] && (valueRange[0] = -Infinity);
    hoverRange[1] > sizeExtent[1] && (valueRange[1] = Infinity);
    // Do not show indicator when mouse is over handle,
    // otherwise labels overlap, especially when dragging.
    if (hoverOnBar) {
      if (valueRange[0] === -Infinity) {
        this._showIndicator(cursorValue, valueRange[1], '< ', halfHoverLinkSize);
      } else if (valueRange[1] === Infinity) {
        this._showIndicator(cursorValue, valueRange[0], '> ', halfHoverLinkSize);
      } else {
        this._showIndicator(cursorValue, cursorValue, '≈ ', halfHoverLinkSize);
      }
    }
    // When realtime is set as false, handles, which are in barGroup,
    // also trigger hoverLink, which help user to realize where they
    // focus on when dragging. (see test/heatmap-large.html)
    // When realtime is set as true, highlight will not show when hover
    // handle, because the label on handle, which displays a exact value
    // but not range, might mislead users.
    const oldBatch = this._hoverLinkDataIndices;
    let newBatch = [];
    if (hoverOnBar || useHoverLinkOnHandle(visualMapModel)) {
      newBatch = this._hoverLinkDataIndices = visualMapModel.findTargetDataIndices(valueRange);
    }
    const resultBatches = modelUtil.compressBatches(oldBatch, newBatch);
    this._dispatchHighDown('downplay', helper.makeHighDownBatch(resultBatches[0], visualMapModel));
    this._dispatchHighDown('highlight', helper.makeHighDownBatch(resultBatches[1], visualMapModel));
  }
  _hoverLinkFromSeriesMouseOver(e) {
    let ecData;
    findEventDispatcher(e.target, target => {
      const currECData = getECData(target);
      if (currECData.dataIndex != null) {
        ecData = currECData;
        return true;
      }
    }, true);
    if (!ecData) {
      return;
    }
    const dataModel = this.ecModel.getSeriesByIndex(ecData.seriesIndex);
    const visualMapModel = this.visualMapModel;
    if (!visualMapModel.isTargetSeries(dataModel)) {
      return;
    }
    const data = dataModel.getData(ecData.dataType);
    const value = data.getStore().get(visualMapModel.getDataDimensionIndex(data), ecData.dataIndex);
    if (!isNaN(value)) {
      this._showIndicator(value, value);
    }
  }
  _hideIndicator() {
    const shapes = this._shapes;
    shapes.indicator && shapes.indicator.attr('invisible', true);
    shapes.indicatorLabel && shapes.indicatorLabel.attr('invisible', true);
    const handleLabels = this._shapes.handleLabels;
    if (handleLabels) {
      for (let i = 0; i < handleLabels.length; i++) {
        // Fade out handle labels.
        // NOTE: Must use api enter/leave on emphasis/blur/select state. Or the global states manager will change it.
        this.api.leaveBlur(handleLabels[i]);
      }
    }
  }
  _clearHoverLinkToSeries() {
    this._hideIndicator();
    const indices = this._hoverLinkDataIndices;
    this._dispatchHighDown('downplay', helper.makeHighDownBatch(indices, this.visualMapModel));
    indices.length = 0;
  }
  _clearHoverLinkFromSeries() {
    this._hideIndicator();
    const zr = this.api.getZr();
    zr.off('mouseover', this._hoverLinkFromSeriesMouseOver);
    zr.off('mouseout', this._hideIndicator);
  }
  _applyTransform(vertex, element, inverse, global) {
    const transform = graphic.getTransform(element, global ? null : this.group);
    return zrUtil.isArray(vertex) ? graphic.applyTransform(vertex, transform, inverse) : graphic.transformDirection(vertex, transform, inverse);
  }
  // TODO: TYPE more specified payload types.
  _dispatchHighDown(type, batch) {
    batch && batch.length && this.api.dispatchAction({
      type: type,
      batch: batch
    });
  }
  /**
   * @override
   */
  dispose() {
    this._clearHoverLinkFromSeries();
    this._clearHoverLinkToSeries();
  }
}
ContinuousView.type = 'visualMap.continuous';
function createPolygon(points, cursor, onDrift, onDragEnd) {
  return new graphic.Polygon({
    shape: {
      points: points
    },
    draggable: !!onDrift,
    cursor: cursor,
    drift: onDrift,
    onmousemove(e) {
      // For mobile device, prevent screen slider on the button.
      eventTool.stop(e.event);
    },
    ondragend: onDragEnd
  });
}
function getHalfHoverLinkSize(visualMapModel, dataExtent, sizeExtent) {
  let halfHoverLinkSize = HOVER_LINK_SIZE / 2;
  const hoverLinkDataSize = visualMapModel.get('hoverLinkDataSize');
  if (hoverLinkDataSize) {
    halfHoverLinkSize = linearMap(hoverLinkDataSize, dataExtent, sizeExtent, true) / 2;
  }
  return halfHoverLinkSize;
}
function useHoverLinkOnHandle(visualMapModel) {
  const hoverLinkOnHandle = visualMapModel.get('hoverLinkOnHandle');
  return !!(hoverLinkOnHandle == null ? visualMapModel.get('realtime') : hoverLinkOnHandle);
}
function getCursor(orient) {
  return orient === 'vertical' ? 'ns-resize' : 'ew-resize';
}
export default ContinuousView;