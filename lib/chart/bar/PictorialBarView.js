
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
import * as graphic from '../../util/graphic.js';
import { toggleHoverEmphasis } from '../../util/states.js';
import { createSymbol, normalizeSymbolOffset } from '../../util/symbol.js';
import { parsePercent, isNumeric } from '../../util/number.js';
import ChartView from '../../view/Chart.js';
import { getDefaultLabel } from '../helper/labelHelper.js';
import { setLabelStyle, getLabelStatesModels } from '../../label/labelStyle.js';
import ZRImage from 'zrender/lib/graphic/Image.js';
import { getECData } from '../../util/innerStore.js';
import { createClipPath } from '../helper/createClipPathFromCoordSys.js';
const BAR_BORDER_WIDTH_QUERY = ['itemStyle', 'borderWidth'];
// index: +isHorizontal
const LAYOUT_ATTRS = [{
  xy: 'x',
  wh: 'width',
  index: 0,
  posDesc: ['left', 'right']
}, {
  xy: 'y',
  wh: 'height',
  index: 1,
  posDesc: ['top', 'bottom']
}];
const pathForLineWidth = new graphic.Circle();
class PictorialBarView extends ChartView {
  constructor() {
    super(...arguments);
    this.type = PictorialBarView.type;
  }
  render(seriesModel, ecModel, api) {
    const group = this.group;
    const data = seriesModel.getData();
    const oldData = this._data;
    const cartesian = seriesModel.coordinateSystem;
    const baseAxis = cartesian.getBaseAxis();
    const isHorizontal = baseAxis.isHorizontal();
    const coordSysRect = cartesian.master.getRect();
    const opt = {
      ecSize: {
        width: api.getWidth(),
        height: api.getHeight()
      },
      seriesModel: seriesModel,
      coordSys: cartesian,
      coordSysExtent: [[coordSysRect.x, coordSysRect.x + coordSysRect.width], [coordSysRect.y, coordSysRect.y + coordSysRect.height]],
      isHorizontal: isHorizontal,
      valueDim: LAYOUT_ATTRS[+isHorizontal],
      categoryDim: LAYOUT_ATTRS[1 - +isHorizontal]
    };
    data.diff(oldData).add(function (dataIndex) {
      if (!data.hasValue(dataIndex)) {
        return;
      }
      const itemModel = getItemModel(data, dataIndex);
      const symbolMeta = getSymbolMeta(data, dataIndex, itemModel, opt);
      const bar = createBar(data, opt, symbolMeta);
      data.setItemGraphicEl(dataIndex, bar);
      group.add(bar);
      updateCommon(bar, opt, symbolMeta);
    }).update(function (newIndex, oldIndex) {
      let bar = oldData.getItemGraphicEl(oldIndex);
      if (!data.hasValue(newIndex)) {
        group.remove(bar);
        return;
      }
      const itemModel = getItemModel(data, newIndex);
      const symbolMeta = getSymbolMeta(data, newIndex, itemModel, opt);
      const pictorialShapeStr = getShapeStr(data, symbolMeta);
      if (bar && pictorialShapeStr !== bar.__pictorialShapeStr) {
        group.remove(bar);
        data.setItemGraphicEl(newIndex, null);
        bar = null;
      }
      if (bar) {
        updateBar(bar, opt, symbolMeta);
      } else {
        bar = createBar(data, opt, symbolMeta, true);
      }
      data.setItemGraphicEl(newIndex, bar);
      bar.__pictorialSymbolMeta = symbolMeta;
      // Add back
      group.add(bar);
      updateCommon(bar, opt, symbolMeta);
    }).remove(function (dataIndex) {
      const bar = oldData.getItemGraphicEl(dataIndex);
      bar && removeBar(oldData, dataIndex, bar.__pictorialSymbolMeta.animationModel, bar);
    }).execute();
    // Do clipping
    const clipPath = seriesModel.get('clip', true) ? createClipPath(seriesModel.coordinateSystem, false, seriesModel) : null;
    if (clipPath) {
      group.setClipPath(clipPath);
    } else {
      group.removeClipPath();
    }
    this._data = data;
    return this.group;
  }
  remove(ecModel, api) {
    const group = this.group;
    const data = this._data;
    if (ecModel.get('animation')) {
      if (data) {
        data.eachItemGraphicEl(function (bar) {
          removeBar(data, getECData(bar).dataIndex, ecModel, bar);
        });
      }
    } else {
      group.removeAll();
    }
  }
}
PictorialBarView.type = 'pictorialBar';
// Set or calculate default value about symbol, and calculate layout info.
function getSymbolMeta(data, dataIndex, itemModel, opt) {
  const layout = data.getItemLayout(dataIndex);
  const symbolRepeat = itemModel.get('symbolRepeat');
  const symbolClip = itemModel.get('symbolClip');
  const symbolPosition = itemModel.get('symbolPosition') || 'start';
  const symbolRotate = itemModel.get('symbolRotate');
  const rotation = (symbolRotate || 0) * Math.PI / 180 || 0;
  const symbolPatternSize = itemModel.get('symbolPatternSize') || 2;
  const isAnimationEnabled = itemModel.isAnimationEnabled();
  const symbolMeta = {
    dataIndex: dataIndex,
    layout: layout,
    itemModel: itemModel,
    symbolType: data.getItemVisual(dataIndex, 'symbol') || 'circle',
    style: data.getItemVisual(dataIndex, 'style'),
    symbolClip: symbolClip,
    symbolRepeat: symbolRepeat,
    symbolRepeatDirection: itemModel.get('symbolRepeatDirection'),
    symbolPatternSize: symbolPatternSize,
    rotation: rotation,
    animationModel: isAnimationEnabled ? itemModel : null,
    hoverScale: isAnimationEnabled && itemModel.get(['emphasis', 'scale']),
    z2: itemModel.getShallow('z', true) || 0
  };
  prepareBarLength(itemModel, symbolRepeat, layout, opt, symbolMeta);
  prepareSymbolSize(data, dataIndex, layout, symbolRepeat, symbolClip, symbolMeta.boundingLength, symbolMeta.pxSign, symbolPatternSize, opt, symbolMeta);
  prepareLineWidth(itemModel, symbolMeta.symbolScale, rotation, opt, symbolMeta);
  const symbolSize = symbolMeta.symbolSize;
  const symbolOffset = normalizeSymbolOffset(itemModel.get('symbolOffset'), symbolSize);
  prepareLayoutInfo(itemModel, symbolSize, layout, symbolRepeat, symbolClip, symbolOffset, symbolPosition, symbolMeta.valueLineWidth, symbolMeta.boundingLength, symbolMeta.repeatCutLength, opt, symbolMeta);
  return symbolMeta;
}
// bar length can be negative.
function prepareBarLength(itemModel, symbolRepeat, layout, opt, outputSymbolMeta) {
  const valueDim = opt.valueDim;
  const symbolBoundingData = itemModel.get('symbolBoundingData');
  const valueAxis = opt.coordSys.getOtherAxis(opt.coordSys.getBaseAxis());
  const zeroPx = valueAxis.toGlobalCoord(valueAxis.dataToCoord(0));
  const pxSignIdx = 1 - +(layout[valueDim.wh] <= 0);
  let boundingLength;
  if (zrUtil.isArray(symbolBoundingData)) {
    const symbolBoundingExtent = [convertToCoordOnAxis(valueAxis, symbolBoundingData[0]) - zeroPx, convertToCoordOnAxis(valueAxis, symbolBoundingData[1]) - zeroPx];
    symbolBoundingExtent[1] < symbolBoundingExtent[0] && symbolBoundingExtent.reverse();
    boundingLength = symbolBoundingExtent[pxSignIdx];
  } else if (symbolBoundingData != null) {
    boundingLength = convertToCoordOnAxis(valueAxis, symbolBoundingData) - zeroPx;
  } else if (symbolRepeat) {
    boundingLength = opt.coordSysExtent[valueDim.index][pxSignIdx] - zeroPx;
  } else {
    boundingLength = layout[valueDim.wh];
  }
  outputSymbolMeta.boundingLength = boundingLength;
  if (symbolRepeat) {
    outputSymbolMeta.repeatCutLength = layout[valueDim.wh];
  }
  // if 'pxSign' means sign of pixel,  it can't be zero, or symbolScale will be zero
  // and when borderWidth be settled, the actual linewidth will be NaN
  outputSymbolMeta.pxSign = boundingLength > 0 ? 1 : -1;
}
function convertToCoordOnAxis(axis, value) {
  return axis.toGlobalCoord(axis.dataToCoord(axis.scale.parse(value)));
}
// Support ['100%', '100%']
function prepareSymbolSize(data, dataIndex, layout, symbolRepeat, symbolClip, boundingLength, pxSign, symbolPatternSize, opt, outputSymbolMeta) {
  const valueDim = opt.valueDim;
  const categoryDim = opt.categoryDim;
  const categorySize = Math.abs(layout[categoryDim.wh]);
  const symbolSize = data.getItemVisual(dataIndex, 'symbolSize');
  let parsedSymbolSize;
  if (zrUtil.isArray(symbolSize)) {
    parsedSymbolSize = symbolSize.slice();
  } else {
    if (symbolSize == null) {
      // will parse to number below
      parsedSymbolSize = ['100%', '100%'];
    } else {
      parsedSymbolSize = [symbolSize, symbolSize];
    }
  }
  // Note: percentage symbolSize (like '100%') do not consider lineWidth, because it is
  // to complicated to calculate real percent value if considering scaled lineWidth.
  // So the actual size will bigger than layout size if lineWidth is bigger than zero,
  // which can be tolerated in pictorial chart.
  parsedSymbolSize[categoryDim.index] = parsePercent(parsedSymbolSize[categoryDim.index], categorySize);
  parsedSymbolSize[valueDim.index] = parsePercent(parsedSymbolSize[valueDim.index], symbolRepeat ? categorySize : Math.abs(boundingLength));
  outputSymbolMeta.symbolSize = parsedSymbolSize;
  // If x or y is less than zero, show reversed shape.
  const symbolScale = outputSymbolMeta.symbolScale = [parsedSymbolSize[0] / symbolPatternSize, parsedSymbolSize[1] / symbolPatternSize];
  // Follow convention, 'right' and 'top' is the normal scale.
  symbolScale[valueDim.index] *= (opt.isHorizontal ? -1 : 1) * pxSign;
}
function prepareLineWidth(itemModel, symbolScale, rotation, opt, outputSymbolMeta) {
  // In symbols are drawn with scale, so do not need to care about the case that width
  // or height are too small. But symbol use strokeNoScale, where acture lineWidth should
  // be calculated.
  let valueLineWidth = itemModel.get(BAR_BORDER_WIDTH_QUERY) || 0;
  if (valueLineWidth) {
    pathForLineWidth.attr({
      scaleX: symbolScale[0],
      scaleY: symbolScale[1],
      rotation: rotation
    });
    pathForLineWidth.updateTransform();
    valueLineWidth /= pathForLineWidth.getLineScale();
    valueLineWidth *= symbolScale[opt.valueDim.index];
  }
  outputSymbolMeta.valueLineWidth = valueLineWidth || 0;
}
function prepareLayoutInfo(itemModel, symbolSize, layout, symbolRepeat, symbolClip, symbolOffset, symbolPosition, valueLineWidth, boundingLength, repeatCutLength, opt, outputSymbolMeta) {
  const categoryDim = opt.categoryDim;
  const valueDim = opt.valueDim;
  const pxSign = outputSymbolMeta.pxSign;
  const unitLength = Math.max(symbolSize[valueDim.index] + valueLineWidth, 0);
  let pathLen = unitLength;
  // Note: rotation will not effect the layout of symbols, because user may
  // want symbols to rotate on its center, which should not be translated
  // when rotating.
  if (symbolRepeat) {
    const absBoundingLength = Math.abs(boundingLength);
    let symbolMargin = zrUtil.retrieve(itemModel.get('symbolMargin'), '15%') + '';
    let hasEndGap = false;
    if (symbolMargin.lastIndexOf('!') === symbolMargin.length - 1) {
      hasEndGap = true;
      symbolMargin = symbolMargin.slice(0, symbolMargin.length - 1);
    }
    let symbolMarginNumeric = parsePercent(symbolMargin, symbolSize[valueDim.index]);
    let uLenWithMargin = Math.max(unitLength + symbolMarginNumeric * 2, 0);
    // When symbol margin is less than 0, margin at both ends will be subtracted
    // to ensure that all of the symbols will not be overflow the given area.
    let endFix = hasEndGap ? 0 : symbolMarginNumeric * 2;
    // Both final repeatTimes and final symbolMarginNumeric area calculated based on
    // boundingLength.
    const repeatSpecified = isNumeric(symbolRepeat);
    let repeatTimes = repeatSpecified ? symbolRepeat : toIntTimes((absBoundingLength + endFix) / uLenWithMargin);
    // Adjust calculate margin, to ensure each symbol is displayed
    // entirely in the given layout area.
    const mDiff = absBoundingLength - repeatTimes * unitLength;
    symbolMarginNumeric = mDiff / 2 / (hasEndGap ? repeatTimes : Math.max(repeatTimes - 1, 1));
    uLenWithMargin = unitLength + symbolMarginNumeric * 2;
    endFix = hasEndGap ? 0 : symbolMarginNumeric * 2;
    // Update repeatTimes when not all symbol will be shown.
    if (!repeatSpecified && symbolRepeat !== 'fixed') {
      repeatTimes = repeatCutLength ? toIntTimes((Math.abs(repeatCutLength) + endFix) / uLenWithMargin) : 0;
    }
    pathLen = repeatTimes * uLenWithMargin - endFix;
    outputSymbolMeta.repeatTimes = repeatTimes;
    outputSymbolMeta.symbolMargin = symbolMarginNumeric;
  }
  const sizeFix = pxSign * (pathLen / 2);
  const pathPosition = outputSymbolMeta.pathPosition = [];
  pathPosition[categoryDim.index] = layout[categoryDim.wh] / 2;
  pathPosition[valueDim.index] = symbolPosition === 'start' ? sizeFix : symbolPosition === 'end' ? boundingLength - sizeFix : boundingLength / 2; // 'center'
  if (symbolOffset) {
    pathPosition[0] += symbolOffset[0];
    pathPosition[1] += symbolOffset[1];
  }
  const bundlePosition = outputSymbolMeta.bundlePosition = [];
  bundlePosition[categoryDim.index] = layout[categoryDim.xy];
  bundlePosition[valueDim.index] = layout[valueDim.xy];
  const barRectShape = outputSymbolMeta.barRectShape = zrUtil.extend({}, layout);
  barRectShape[valueDim.wh] = pxSign * Math.max(Math.abs(layout[valueDim.wh]), Math.abs(pathPosition[valueDim.index] + sizeFix));
  barRectShape[categoryDim.wh] = layout[categoryDim.wh];
  const clipShape = outputSymbolMeta.clipShape = {};
  // Consider that symbol may be overflow layout rect.
  clipShape[categoryDim.xy] = -layout[categoryDim.xy];
  clipShape[categoryDim.wh] = opt.ecSize[categoryDim.wh];
  clipShape[valueDim.xy] = 0;
  clipShape[valueDim.wh] = layout[valueDim.wh];
}
function createPath(symbolMeta) {
  const symbolPatternSize = symbolMeta.symbolPatternSize;
  const path = createSymbol(
  // Consider texture img, make a big size.
  symbolMeta.symbolType, -symbolPatternSize / 2, -symbolPatternSize / 2, symbolPatternSize, symbolPatternSize);
  path.attr({
    culling: true
  });
  path.type !== 'image' && path.setStyle({
    strokeNoScale: true
  });
  return path;
}
function createOrUpdateRepeatSymbols(bar, opt, symbolMeta, isUpdate) {
  const bundle = bar.__pictorialBundle;
  const symbolSize = symbolMeta.symbolSize;
  const valueLineWidth = symbolMeta.valueLineWidth;
  const pathPosition = symbolMeta.pathPosition;
  const valueDim = opt.valueDim;
  const repeatTimes = symbolMeta.repeatTimes || 0;
  let index = 0;
  const unit = symbolSize[opt.valueDim.index] + valueLineWidth + symbolMeta.symbolMargin * 2;
  eachPath(bar, function (path) {
    path.__pictorialAnimationIndex = index;
    path.__pictorialRepeatTimes = repeatTimes;
    if (index < repeatTimes) {
      updateAttr(path, null, makeTarget(index), symbolMeta, isUpdate);
    } else {
      updateAttr(path, null, {
        scaleX: 0,
        scaleY: 0
      }, symbolMeta, isUpdate, function () {
        bundle.remove(path);
      });
    }
    // updateHoverAnimation(path, symbolMeta);
    index++;
  });
  for (; index < repeatTimes; index++) {
    const path = createPath(symbolMeta);
    path.__pictorialAnimationIndex = index;
    path.__pictorialRepeatTimes = repeatTimes;
    bundle.add(path);
    const target = makeTarget(index);
    updateAttr(path, {
      x: target.x,
      y: target.y,
      scaleX: 0,
      scaleY: 0
    }, {
      scaleX: target.scaleX,
      scaleY: target.scaleY,
      rotation: target.rotation
    }, symbolMeta, isUpdate);
  }
  function makeTarget(index) {
    const position = pathPosition.slice();
    // (start && pxSign > 0) || (end && pxSign < 0): i = repeatTimes - index
    // Otherwise: i = index;
    const pxSign = symbolMeta.pxSign;
    let i = index;
    if (symbolMeta.symbolRepeatDirection === 'start' ? pxSign > 0 : pxSign < 0) {
      i = repeatTimes - 1 - index;
    }
    position[valueDim.index] = unit * (i - repeatTimes / 2 + 0.5) + pathPosition[valueDim.index];
    return {
      x: position[0],
      y: position[1],
      scaleX: symbolMeta.symbolScale[0],
      scaleY: symbolMeta.symbolScale[1],
      rotation: symbolMeta.rotation
    };
  }
}
function createOrUpdateSingleSymbol(bar, opt, symbolMeta, isUpdate) {
  const bundle = bar.__pictorialBundle;
  let mainPath = bar.__pictorialMainPath;
  if (!mainPath) {
    mainPath = bar.__pictorialMainPath = createPath(symbolMeta);
    bundle.add(mainPath);
    updateAttr(mainPath, {
      x: symbolMeta.pathPosition[0],
      y: symbolMeta.pathPosition[1],
      scaleX: 0,
      scaleY: 0,
      rotation: symbolMeta.rotation
    }, {
      scaleX: symbolMeta.symbolScale[0],
      scaleY: symbolMeta.symbolScale[1]
    }, symbolMeta, isUpdate);
  } else {
    updateAttr(mainPath, null, {
      x: symbolMeta.pathPosition[0],
      y: symbolMeta.pathPosition[1],
      scaleX: symbolMeta.symbolScale[0],
      scaleY: symbolMeta.symbolScale[1],
      rotation: symbolMeta.rotation
    }, symbolMeta, isUpdate);
  }
}
// bar rect is used for label.
function createOrUpdateBarRect(bar, symbolMeta, isUpdate) {
  const rectShape = zrUtil.extend({}, symbolMeta.barRectShape);
  let barRect = bar.__pictorialBarRect;
  if (!barRect) {
    barRect = bar.__pictorialBarRect = new graphic.Rect({
      z2: 2,
      shape: rectShape,
      silent: true,
      style: {
        stroke: 'transparent',
        fill: 'transparent',
        lineWidth: 0
      }
    });
    barRect.disableMorphing = true;
    bar.add(barRect);
  } else {
    updateAttr(barRect, null, {
      shape: rectShape
    }, symbolMeta, isUpdate);
  }
}
function createOrUpdateClip(bar, opt, symbolMeta, isUpdate) {
  // If not clip, symbol will be remove and rebuilt.
  if (symbolMeta.symbolClip) {
    let clipPath = bar.__pictorialClipPath;
    const clipShape = zrUtil.extend({}, symbolMeta.clipShape);
    const valueDim = opt.valueDim;
    const animationModel = symbolMeta.animationModel;
    const dataIndex = symbolMeta.dataIndex;
    if (clipPath) {
      graphic.updateProps(clipPath, {
        shape: clipShape
      }, animationModel, dataIndex);
    } else {
      clipShape[valueDim.wh] = 0;
      clipPath = new graphic.Rect({
        shape: clipShape
      });
      bar.__pictorialBundle.setClipPath(clipPath);
      bar.__pictorialClipPath = clipPath;
      const target = {};
      target[valueDim.wh] = symbolMeta.clipShape[valueDim.wh];
      graphic[isUpdate ? 'updateProps' : 'initProps'](clipPath, {
        shape: target
      }, animationModel, dataIndex);
    }
  }
}
function getItemModel(data, dataIndex) {
  const itemModel = data.getItemModel(dataIndex);
  itemModel.getAnimationDelayParams = getAnimationDelayParams;
  itemModel.isAnimationEnabled = isAnimationEnabled;
  return itemModel;
}
function getAnimationDelayParams(path) {
  // The order is the same as the z-order, see `symbolRepeatDiretion`.
  return {
    index: path.__pictorialAnimationIndex,
    count: path.__pictorialRepeatTimes
  };
}
function isAnimationEnabled() {
  // `animation` prop can be set on itemModel in pictorial bar chart.
  return this.parentModel.isAnimationEnabled() && !!this.getShallow('animation');
}
function createBar(data, opt, symbolMeta, isUpdate) {
  // bar is the main element for each data.
  const bar = new graphic.Group();
  // bundle is used for location and clip.
  const bundle = new graphic.Group();
  bar.add(bundle);
  bar.__pictorialBundle = bundle;
  bundle.x = symbolMeta.bundlePosition[0];
  bundle.y = symbolMeta.bundlePosition[1];
  if (symbolMeta.symbolRepeat) {
    createOrUpdateRepeatSymbols(bar, opt, symbolMeta);
  } else {
    createOrUpdateSingleSymbol(bar, opt, symbolMeta);
  }
  createOrUpdateBarRect(bar, symbolMeta, isUpdate);
  createOrUpdateClip(bar, opt, symbolMeta, isUpdate);
  bar.__pictorialShapeStr = getShapeStr(data, symbolMeta);
  bar.__pictorialSymbolMeta = symbolMeta;
  return bar;
}
function updateBar(bar, opt, symbolMeta) {
  const animationModel = symbolMeta.animationModel;
  const dataIndex = symbolMeta.dataIndex;
  const bundle = bar.__pictorialBundle;
  graphic.updateProps(bundle, {
    x: symbolMeta.bundlePosition[0],
    y: symbolMeta.bundlePosition[1]
  }, animationModel, dataIndex);
  if (symbolMeta.symbolRepeat) {
    createOrUpdateRepeatSymbols(bar, opt, symbolMeta, true);
  } else {
    createOrUpdateSingleSymbol(bar, opt, symbolMeta, true);
  }
  createOrUpdateBarRect(bar, symbolMeta, true);
  createOrUpdateClip(bar, opt, symbolMeta, true);
}
function removeBar(data, dataIndex, animationModel, bar) {
  // Not show text when animating
  const labelRect = bar.__pictorialBarRect;
  labelRect && labelRect.removeTextContent();
  const paths = [];
  eachPath(bar, function (path) {
    paths.push(path);
  });
  bar.__pictorialMainPath && paths.push(bar.__pictorialMainPath);
  // I do not find proper remove animation for clip yet.
  bar.__pictorialClipPath && (animationModel = null);
  zrUtil.each(paths, function (path) {
    graphic.removeElement(path, {
      scaleX: 0,
      scaleY: 0
    }, animationModel, dataIndex, function () {
      bar.parent && bar.parent.remove(bar);
    });
  });
  data.setItemGraphicEl(dataIndex, null);
}
function getShapeStr(data, symbolMeta) {
  return [data.getItemVisual(symbolMeta.dataIndex, 'symbol') || 'none', !!symbolMeta.symbolRepeat, !!symbolMeta.symbolClip].join(':');
}
function eachPath(bar, cb, context) {
  // Do not use Group#eachChild, because it do not support remove.
  zrUtil.each(bar.__pictorialBundle.children(), function (el) {
    el !== bar.__pictorialBarRect && cb.call(context, el);
  });
}
function updateAttr(el, immediateAttrs, animationAttrs, symbolMeta, isUpdate, cb) {
  immediateAttrs && el.attr(immediateAttrs);
  // when symbolCip used, only clip path has init animation, otherwise it would be weird effect.
  if (symbolMeta.symbolClip && !isUpdate) {
    animationAttrs && el.attr(animationAttrs);
  } else {
    animationAttrs && graphic[isUpdate ? 'updateProps' : 'initProps'](el, animationAttrs, symbolMeta.animationModel, symbolMeta.dataIndex, cb);
  }
}
function updateCommon(bar, opt, symbolMeta) {
  const dataIndex = symbolMeta.dataIndex;
  const itemModel = symbolMeta.itemModel;
  // Color must be excluded.
  // Because symbol provide setColor individually to set fill and stroke
  const emphasisModel = itemModel.getModel('emphasis');
  const emphasisStyle = emphasisModel.getModel('itemStyle').getItemStyle();
  const blurStyle = itemModel.getModel(['blur', 'itemStyle']).getItemStyle();
  const selectStyle = itemModel.getModel(['select', 'itemStyle']).getItemStyle();
  const cursorStyle = itemModel.getShallow('cursor');
  const focus = emphasisModel.get('focus');
  const blurScope = emphasisModel.get('blurScope');
  const hoverScale = emphasisModel.get('scale');
  eachPath(bar, function (path) {
    if (path instanceof ZRImage) {
      const pathStyle = path.style;
      path.useStyle(zrUtil.extend({
        // TODO other properties like dx, dy ?
        image: pathStyle.image,
        x: pathStyle.x,
        y: pathStyle.y,
        width: pathStyle.width,
        height: pathStyle.height
      }, symbolMeta.style));
    } else {
      path.useStyle(symbolMeta.style);
    }
    const emphasisState = path.ensureState('emphasis');
    emphasisState.style = emphasisStyle;
    if (hoverScale) {
      // NOTE: Must after scale is set after updateAttr
      emphasisState.scaleX = path.scaleX * 1.1;
      emphasisState.scaleY = path.scaleY * 1.1;
    }
    path.ensureState('blur').style = blurStyle;
    path.ensureState('select').style = selectStyle;
    cursorStyle && (path.cursor = cursorStyle);
    path.z2 = symbolMeta.z2;
  });
  const barPositionOutside = opt.valueDim.posDesc[+(symbolMeta.boundingLength > 0)];
  const barRect = bar.__pictorialBarRect;
  barRect.ignoreClip = true;
  setLabelStyle(barRect, getLabelStatesModels(itemModel), {
    labelFetcher: opt.seriesModel,
    labelDataIndex: dataIndex,
    defaultText: getDefaultLabel(opt.seriesModel.getData(), dataIndex),
    inheritColor: symbolMeta.style.fill,
    defaultOpacity: symbolMeta.style.opacity,
    defaultOutsidePosition: barPositionOutside
  });
  toggleHoverEmphasis(bar, focus, blurScope, emphasisModel.get('disabled'));
}
function toIntTimes(times) {
  const roundedTimes = Math.round(times);
  // Escapse accurate error
  return Math.abs(times - roundedTimes) < 1e-4 ? roundedTimes : Math.ceil(times);
}
export default PictorialBarView;