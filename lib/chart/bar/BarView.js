
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
import Path from 'zrender/lib/graphic/Path.js';
import Group from 'zrender/lib/graphic/Group.js';
import { extend, each, map } from 'zrender/lib/core/util.js';
import { Rect, Sector, updateProps, initProps, removeElementWithFadeOut, traverseElements } from '../../util/graphic.js';
import { getECData } from '../../util/innerStore.js';
import { setStatesStylesFromModel, toggleHoverEmphasis } from '../../util/states.js';
import { setLabelStyle, getLabelStatesModels, setLabelValueAnimation, labelInner } from '../../label/labelStyle.js';
import { throttle } from '../../util/throttle.js';
import { createClipPath } from '../helper/createClipPathFromCoordSys.js';
import Sausage from '../../util/shape/sausage.js';
import ChartView from '../../view/Chart.js';
import { isCoordinateSystemType } from '../../coord/CoordinateSystem.js';
import { getDefaultLabel, getDefaultInterpolatedLabel } from '../helper/labelHelper.js';
import { warn } from '../../util/log.js';
import { createSectorCalculateTextPosition, setSectorTextRotation } from '../../label/sectorLabel.js';
import { saveOldStyle } from '../../animation/basicTransition.js';
import { getSectorCornerRadius } from '../helper/sectorHelper.js';
const mathMax = Math.max;
const mathMin = Math.min;
function getClipArea(coord, data) {
  const coordSysClipArea = coord.getArea && coord.getArea();
  if (isCoordinateSystemType(coord, 'cartesian2d')) {
    const baseAxis = coord.getBaseAxis();
    // When boundaryGap is false or using time axis. bar may exceed the grid.
    // We should not clip this part.
    // See test/bar2.html
    if (baseAxis.type !== 'category' || !baseAxis.onBand) {
      const expandWidth = data.getLayout('bandWidth');
      if (baseAxis.isHorizontal()) {
        coordSysClipArea.x -= expandWidth;
        coordSysClipArea.width += expandWidth * 2;
      } else {
        coordSysClipArea.y -= expandWidth;
        coordSysClipArea.height += expandWidth * 2;
      }
    }
  }
  return coordSysClipArea;
}
class BarView extends ChartView {
  constructor() {
    super();
    this.type = BarView.type;
    this._isFirstFrame = true;
  }
  render(seriesModel, ecModel, api, payload) {
    this._model = seriesModel;
    this._removeOnRenderedListener(api);
    this._updateDrawMode(seriesModel);
    const coordinateSystemType = seriesModel.get('coordinateSystem');
    if (coordinateSystemType === 'cartesian2d' || coordinateSystemType === 'polar') {
      // Clear previously rendered progressive elements.
      this._progressiveEls = null;
      this._isLargeDraw ? this._renderLarge(seriesModel, ecModel, api) : this._renderNormal(seriesModel, ecModel, api, payload);
    } else if (process.env.NODE_ENV !== 'production') {
      warn('Only cartesian2d and polar supported for bar.');
    }
  }
  incrementalPrepareRender(seriesModel) {
    this._clear();
    this._updateDrawMode(seriesModel);
    // incremental also need to clip, otherwise might be overlow.
    // But must not set clip in each frame, otherwise all of the children will be marked redraw.
    this._updateLargeClip(seriesModel);
  }
  incrementalRender(params, seriesModel) {
    // Reset
    this._progressiveEls = [];
    // Do not support progressive in normal mode.
    this._incrementalRenderLarge(params, seriesModel);
  }
  eachRendered(cb) {
    traverseElements(this._progressiveEls || this.group, cb);
  }
  _updateDrawMode(seriesModel) {
    const isLargeDraw = seriesModel.pipelineContext.large;
    if (this._isLargeDraw == null || isLargeDraw !== this._isLargeDraw) {
      this._isLargeDraw = isLargeDraw;
      this._clear();
    }
  }
  _renderNormal(seriesModel, ecModel, api, payload) {
    const group = this.group;
    const data = seriesModel.getData();
    const oldData = this._data;
    const coord = seriesModel.coordinateSystem;
    const baseAxis = coord.getBaseAxis();
    let isHorizontalOrRadial;
    if (coord.type === 'cartesian2d') {
      isHorizontalOrRadial = baseAxis.isHorizontal();
    } else if (coord.type === 'polar') {
      isHorizontalOrRadial = baseAxis.dim === 'angle';
    }
    const animationModel = seriesModel.isAnimationEnabled() ? seriesModel : null;
    const realtimeSortCfg = shouldRealtimeSort(seriesModel, coord);
    if (realtimeSortCfg) {
      this._enableRealtimeSort(realtimeSortCfg, data, api);
    }
    const needsClip = seriesModel.get('clip', true) || realtimeSortCfg;
    const coordSysClipArea = getClipArea(coord, data);
    // If there is clipPath created in large mode. Remove it.
    group.removeClipPath();
    // We don't use clipPath in normal mode because we needs a perfect animation
    // And don't want the label are clipped.
    const roundCap = seriesModel.get('roundCap', true);
    const drawBackground = seriesModel.get('showBackground', true);
    const backgroundModel = seriesModel.getModel('backgroundStyle');
    const barBorderRadius = backgroundModel.get('borderRadius') || 0;
    const bgEls = [];
    const oldBgEls = this._backgroundEls;
    const isInitSort = payload && payload.isInitSort;
    const isChangeOrder = payload && payload.type === 'changeAxisOrder';
    function createBackground(dataIndex) {
      const bgLayout = getLayout[coord.type](data, dataIndex);
      const bgEl = createBackgroundEl(coord, isHorizontalOrRadial, bgLayout);
      bgEl.useStyle(backgroundModel.getItemStyle());
      // Only cartesian2d support borderRadius.
      if (coord.type === 'cartesian2d') {
        bgEl.setShape('r', barBorderRadius);
      } else {
        bgEl.setShape('cornerRadius', barBorderRadius);
      }
      bgEls[dataIndex] = bgEl;
      return bgEl;
    }
    ;
    data.diff(oldData).add(function (dataIndex) {
      const itemModel = data.getItemModel(dataIndex);
      const layout = getLayout[coord.type](data, dataIndex, itemModel);
      if (drawBackground) {
        createBackground(dataIndex);
      }
      // If dataZoom in filteMode: 'empty', the baseValue can be set as NaN in "axisProxy".
      if (!data.hasValue(dataIndex) || !isValidLayout[coord.type](layout)) {
        return;
      }
      let isClipped = false;
      if (needsClip) {
        // Clip will modify the layout params.
        // And return a boolean to determine if the shape are fully clipped.
        isClipped = clip[coord.type](coordSysClipArea, layout);
      }
      const el = elementCreator[coord.type](seriesModel, data, dataIndex, layout, isHorizontalOrRadial, animationModel, baseAxis.model, false, roundCap);
      if (realtimeSortCfg) {
        /**
         * Force label animation because even if the element is
         * ignored because it's clipped, it may not be clipped after
         * changing order. Then, if not using forceLabelAnimation,
         * the label animation was never started, in which case,
         * the label will be the final value and doesn't have label
         * animation.
         */
        el.forceLabelAnimation = true;
      }
      updateStyle(el, data, dataIndex, itemModel, layout, seriesModel, isHorizontalOrRadial, coord.type === 'polar');
      if (isInitSort) {
        el.attr({
          shape: layout
        });
      } else if (realtimeSortCfg) {
        updateRealtimeAnimation(realtimeSortCfg, animationModel, el, layout, dataIndex, isHorizontalOrRadial, false, false);
      } else {
        initProps(el, {
          shape: layout
        }, seriesModel, dataIndex);
      }
      data.setItemGraphicEl(dataIndex, el);
      group.add(el);
      el.ignore = isClipped;
    }).update(function (newIndex, oldIndex) {
      const itemModel = data.getItemModel(newIndex);
      const layout = getLayout[coord.type](data, newIndex, itemModel);
      if (drawBackground) {
        let bgEl;
        if (oldBgEls.length === 0) {
          bgEl = createBackground(oldIndex);
        } else {
          bgEl = oldBgEls[oldIndex];
          bgEl.useStyle(backgroundModel.getItemStyle());
          // Only cartesian2d support borderRadius.
          if (coord.type === 'cartesian2d') {
            bgEl.setShape('r', barBorderRadius);
          } else {
            bgEl.setShape('cornerRadius', barBorderRadius);
          }
          bgEls[newIndex] = bgEl;
        }
        const bgLayout = getLayout[coord.type](data, newIndex);
        const shape = createBackgroundShape(isHorizontalOrRadial, bgLayout, coord);
        updateProps(bgEl, {
          shape
        }, animationModel, newIndex);
      }
      let el = oldData.getItemGraphicEl(oldIndex);
      if (!data.hasValue(newIndex) || !isValidLayout[coord.type](layout)) {
        group.remove(el);
        return;
      }
      let isClipped = false;
      if (needsClip) {
        isClipped = clip[coord.type](coordSysClipArea, layout);
        if (isClipped) {
          group.remove(el);
        }
      }
      if (!el) {
        el = elementCreator[coord.type](seriesModel, data, newIndex, layout, isHorizontalOrRadial, animationModel, baseAxis.model, !!el, roundCap);
      } else {
        saveOldStyle(el);
      }
      if (realtimeSortCfg) {
        el.forceLabelAnimation = true;
      }
      if (isChangeOrder) {
        const textEl = el.getTextContent();
        if (textEl) {
          const labelInnerStore = labelInner(textEl);
          if (labelInnerStore.prevValue != null) {
            /**
             * Set preValue to be value so that no new label
             * should be started, otherwise, it will take a full
             * `animationDurationUpdate` time to finish the
             * animation, which is not expected.
             */
            labelInnerStore.prevValue = labelInnerStore.value;
          }
        }
      }
      // Not change anything if only order changed.
      // Especially not change label.
      else {
        updateStyle(el, data, newIndex, itemModel, layout, seriesModel, isHorizontalOrRadial, coord.type === 'polar');
      }
      if (isInitSort) {
        el.attr({
          shape: layout
        });
      } else if (realtimeSortCfg) {
        updateRealtimeAnimation(realtimeSortCfg, animationModel, el, layout, newIndex, isHorizontalOrRadial, true, isChangeOrder);
      } else {
        updateProps(el, {
          shape: layout
        }, seriesModel, newIndex, null);
      }
      data.setItemGraphicEl(newIndex, el);
      el.ignore = isClipped;
      group.add(el);
    }).remove(function (dataIndex) {
      const el = oldData.getItemGraphicEl(dataIndex);
      el && removeElementWithFadeOut(el, seriesModel, dataIndex);
    }).execute();
    const bgGroup = this._backgroundGroup || (this._backgroundGroup = new Group());
    bgGroup.removeAll();
    for (let i = 0; i < bgEls.length; ++i) {
      bgGroup.add(bgEls[i]);
    }
    group.add(bgGroup);
    this._backgroundEls = bgEls;
    this._data = data;
  }
  _renderLarge(seriesModel, ecModel, api) {
    this._clear();
    createLarge(seriesModel, this.group);
    this._updateLargeClip(seriesModel);
  }
  _incrementalRenderLarge(params, seriesModel) {
    this._removeBackground();
    createLarge(seriesModel, this.group, this._progressiveEls, true);
  }
  _updateLargeClip(seriesModel) {
    // Use clipPath in large mode.
    const clipPath = seriesModel.get('clip', true) && createClipPath(seriesModel.coordinateSystem, false, seriesModel);
    const group = this.group;
    if (clipPath) {
      group.setClipPath(clipPath);
    } else {
      group.removeClipPath();
    }
  }
  _enableRealtimeSort(realtimeSortCfg, data, api) {
    // If no data in the first frame, wait for data to initSort
    if (!data.count()) {
      return;
    }
    const baseAxis = realtimeSortCfg.baseAxis;
    if (this._isFirstFrame) {
      this._dispatchInitSort(data, realtimeSortCfg, api);
      this._isFirstFrame = false;
    } else {
      const orderMapping = idx => {
        const el = data.getItemGraphicEl(idx);
        const shape = el && el.shape;
        return shape &&
        // The result should be consistent with the initial sort by data value.
        // Do not support the case that both positive and negative exist.
        Math.abs(baseAxis.isHorizontal() ? shape.height : shape.width)
        // If data is NaN, shape.xxx may be NaN, so use || 0 here in case
        || 0;
      };
      this._onRendered = () => {
        this._updateSortWithinSameData(data, orderMapping, baseAxis, api);
      };
      api.getZr().on('rendered', this._onRendered);
    }
  }
  _dataSort(data, baseAxis, orderMapping) {
    const info = [];
    data.each(data.mapDimension(baseAxis.dim), (ordinalNumber, dataIdx) => {
      let mappedValue = orderMapping(dataIdx);
      mappedValue = mappedValue == null ? NaN : mappedValue;
      info.push({
        dataIndex: dataIdx,
        mappedValue,
        ordinalNumber
      });
    });
    info.sort((a, b) => {
      // If NaN, it will be treated as min val.
      return b.mappedValue - a.mappedValue;
    });
    return {
      ordinalNumbers: map(info, item => item.ordinalNumber)
    };
  }
  _isOrderChangedWithinSameData(data, orderMapping, baseAxis) {
    const scale = baseAxis.scale;
    const ordinalDataDim = data.mapDimension(baseAxis.dim);
    let lastValue = Number.MAX_VALUE;
    for (let tickNum = 0, len = scale.getOrdinalMeta().categories.length; tickNum < len; ++tickNum) {
      const rawIdx = data.rawIndexOf(ordinalDataDim, scale.getRawOrdinalNumber(tickNum));
      const value = rawIdx < 0
      // If some tick have no bar, the tick will be treated as min.
      ? Number.MIN_VALUE
      // PENDING: if dataZoom on baseAxis exits, is it a performance issue?
      : orderMapping(data.indexOfRawIndex(rawIdx));
      if (value > lastValue) {
        return true;
      }
      lastValue = value;
    }
    return false;
  }
  /*
   * Consider the case when A and B changed order, whose representing
   * bars are both out of sight, we don't wish to trigger reorder action
   * as long as the order in the view doesn't change.
   */
  _isOrderDifferentInView(orderInfo, baseAxis) {
    const scale = baseAxis.scale;
    const extent = scale.getExtent();
    let tickNum = Math.max(0, extent[0]);
    const tickMax = Math.min(extent[1], scale.getOrdinalMeta().categories.length - 1);
    for (; tickNum <= tickMax; ++tickNum) {
      if (orderInfo.ordinalNumbers[tickNum] !== scale.getRawOrdinalNumber(tickNum)) {
        return true;
      }
    }
  }
  _updateSortWithinSameData(data, orderMapping, baseAxis, api) {
    if (!this._isOrderChangedWithinSameData(data, orderMapping, baseAxis)) {
      return;
    }
    const sortInfo = this._dataSort(data, baseAxis, orderMapping);
    if (this._isOrderDifferentInView(sortInfo, baseAxis)) {
      this._removeOnRenderedListener(api);
      api.dispatchAction({
        type: 'changeAxisOrder',
        componentType: baseAxis.dim + 'Axis',
        axisId: baseAxis.index,
        sortInfo: sortInfo
      });
    }
  }
  _dispatchInitSort(data, realtimeSortCfg, api) {
    const baseAxis = realtimeSortCfg.baseAxis;
    const sortResult = this._dataSort(data, baseAxis, dataIdx => data.get(data.mapDimension(realtimeSortCfg.otherAxis.dim), dataIdx));
    api.dispatchAction({
      type: 'changeAxisOrder',
      componentType: baseAxis.dim + 'Axis',
      isInitSort: true,
      axisId: baseAxis.index,
      sortInfo: sortResult
    });
  }
  remove(ecModel, api) {
    this._clear(this._model);
    this._removeOnRenderedListener(api);
  }
  dispose(ecModel, api) {
    this._removeOnRenderedListener(api);
  }
  _removeOnRenderedListener(api) {
    if (this._onRendered) {
      api.getZr().off('rendered', this._onRendered);
      this._onRendered = null;
    }
  }
  _clear(model) {
    const group = this.group;
    const data = this._data;
    if (model && model.isAnimationEnabled() && data && !this._isLargeDraw) {
      this._removeBackground();
      this._backgroundEls = [];
      data.eachItemGraphicEl(function (el) {
        removeElementWithFadeOut(el, model, getECData(el).dataIndex);
      });
    } else {
      group.removeAll();
    }
    this._data = null;
    this._isFirstFrame = true;
  }
  _removeBackground() {
    this.group.remove(this._backgroundGroup);
    this._backgroundGroup = null;
  }
}
BarView.type = 'bar';
const clip = {
  cartesian2d(coordSysBoundingRect, layout) {
    const signWidth = layout.width < 0 ? -1 : 1;
    const signHeight = layout.height < 0 ? -1 : 1;
    // Needs positive width and height
    if (signWidth < 0) {
      layout.x += layout.width;
      layout.width = -layout.width;
    }
    if (signHeight < 0) {
      layout.y += layout.height;
      layout.height = -layout.height;
    }
    const coordSysX2 = coordSysBoundingRect.x + coordSysBoundingRect.width;
    const coordSysY2 = coordSysBoundingRect.y + coordSysBoundingRect.height;
    const x = mathMax(layout.x, coordSysBoundingRect.x);
    const x2 = mathMin(layout.x + layout.width, coordSysX2);
    const y = mathMax(layout.y, coordSysBoundingRect.y);
    const y2 = mathMin(layout.y + layout.height, coordSysY2);
    const xClipped = x2 < x;
    const yClipped = y2 < y;
    // When xClipped or yClipped, the element will be marked as `ignore`.
    // But we should also place the element at the edge of the coord sys bounding rect.
    // Because if data changed and the bar shows again, its transition animation
    // will begin at this place.
    layout.x = xClipped && x > coordSysX2 ? x2 : x;
    layout.y = yClipped && y > coordSysY2 ? y2 : y;
    layout.width = xClipped ? 0 : x2 - x;
    layout.height = yClipped ? 0 : y2 - y;
    // Reverse back
    if (signWidth < 0) {
      layout.x += layout.width;
      layout.width = -layout.width;
    }
    if (signHeight < 0) {
      layout.y += layout.height;
      layout.height = -layout.height;
    }
    return xClipped || yClipped;
  },
  polar(coordSysClipArea, layout) {
    const signR = layout.r0 <= layout.r ? 1 : -1;
    // Make sure r is larger than r0
    if (signR < 0) {
      const tmp = layout.r;
      layout.r = layout.r0;
      layout.r0 = tmp;
    }
    const r = mathMin(layout.r, coordSysClipArea.r);
    const r0 = mathMax(layout.r0, coordSysClipArea.r0);
    layout.r = r;
    layout.r0 = r0;
    const clipped = r - r0 < 0;
    // Reverse back
    if (signR < 0) {
      const tmp = layout.r;
      layout.r = layout.r0;
      layout.r0 = tmp;
    }
    return clipped;
  }
};
const elementCreator = {
  cartesian2d(seriesModel, data, newIndex, layout, isHorizontal, animationModel, axisModel, isUpdate, roundCap) {
    const rect = new Rect({
      shape: extend({}, layout),
      z2: 1
    });
    rect.__dataIndex = newIndex;
    rect.name = 'item';
    if (animationModel) {
      const rectShape = rect.shape;
      const animateProperty = isHorizontal ? 'height' : 'width';
      rectShape[animateProperty] = 0;
    }
    return rect;
  },
  polar(seriesModel, data, newIndex, layout, isRadial, animationModel, axisModel, isUpdate, roundCap) {
    const ShapeClass = !isRadial && roundCap ? Sausage : Sector;
    const sector = new ShapeClass({
      shape: layout,
      z2: 1
    });
    sector.name = 'item';
    const positionMap = createPolarPositionMapping(isRadial);
    sector.calculateTextPosition = createSectorCalculateTextPosition(positionMap, {
      isRoundCap: ShapeClass === Sausage
    });
    // Animation
    if (animationModel) {
      const sectorShape = sector.shape;
      const animateProperty = isRadial ? 'r' : 'endAngle';
      const animateTarget = {};
      sectorShape[animateProperty] = isRadial ? layout.r0 : layout.startAngle;
      animateTarget[animateProperty] = layout[animateProperty];
      (isUpdate ? updateProps : initProps)(sector, {
        shape: animateTarget
        // __value: typeof dataValue === 'string' ? parseInt(dataValue, 10) : dataValue
      }, animationModel);
    }
    return sector;
  }
};
function shouldRealtimeSort(seriesModel, coordSys) {
  const realtimeSortOption = seriesModel.get('realtimeSort', true);
  const baseAxis = coordSys.getBaseAxis();
  if (process.env.NODE_ENV !== 'production') {
    if (realtimeSortOption) {
      if (baseAxis.type !== 'category') {
        warn('`realtimeSort` will not work because this bar series is not based on a category axis.');
      }
      if (coordSys.type !== 'cartesian2d') {
        warn('`realtimeSort` will not work because this bar series is not on cartesian2d.');
      }
    }
  }
  if (realtimeSortOption && baseAxis.type === 'category' && coordSys.type === 'cartesian2d') {
    return {
      baseAxis: baseAxis,
      otherAxis: coordSys.getOtherAxis(baseAxis)
    };
  }
}
function updateRealtimeAnimation(realtimeSortCfg, seriesAnimationModel, el, layout, newIndex, isHorizontal, isUpdate, isChangeOrder) {
  let seriesTarget;
  let axisTarget;
  if (isHorizontal) {
    axisTarget = {
      x: layout.x,
      width: layout.width
    };
    seriesTarget = {
      y: layout.y,
      height: layout.height
    };
  } else {
    axisTarget = {
      y: layout.y,
      height: layout.height
    };
    seriesTarget = {
      x: layout.x,
      width: layout.width
    };
  }
  if (!isChangeOrder) {
    // Keep the original growth animation if only axis order changed.
    // Not start a new animation.
    (isUpdate ? updateProps : initProps)(el, {
      shape: seriesTarget
    }, seriesAnimationModel, newIndex, null);
  }
  const axisAnimationModel = seriesAnimationModel ? realtimeSortCfg.baseAxis.model : null;
  (isUpdate ? updateProps : initProps)(el, {
    shape: axisTarget
  }, axisAnimationModel, newIndex);
}
function checkPropertiesNotValid(obj, props) {
  for (let i = 0; i < props.length; i++) {
    if (!isFinite(obj[props[i]])) {
      return true;
    }
  }
  return false;
}
const rectPropties = ['x', 'y', 'width', 'height'];
const polarPropties = ['cx', 'cy', 'r', 'startAngle', 'endAngle'];
const isValidLayout = {
  cartesian2d(layout) {
    return !checkPropertiesNotValid(layout, rectPropties);
  },
  polar(layout) {
    return !checkPropertiesNotValid(layout, polarPropties);
  }
};
const getLayout = {
  // itemModel is only used to get borderWidth, which is not needed
  // when calculating bar background layout.
  cartesian2d(data, dataIndex, itemModel) {
    const layout = data.getItemLayout(dataIndex);
    const fixedLineWidth = itemModel ? getLineWidth(itemModel, layout) : 0;
    // fix layout with lineWidth
    const signX = layout.width > 0 ? 1 : -1;
    const signY = layout.height > 0 ? 1 : -1;
    return {
      x: layout.x + signX * fixedLineWidth / 2,
      y: layout.y + signY * fixedLineWidth / 2,
      width: layout.width - signX * fixedLineWidth,
      height: layout.height - signY * fixedLineWidth
    };
  },
  polar(data, dataIndex, itemModel) {
    const layout = data.getItemLayout(dataIndex);
    return {
      cx: layout.cx,
      cy: layout.cy,
      r0: layout.r0,
      r: layout.r,
      startAngle: layout.startAngle,
      endAngle: layout.endAngle,
      clockwise: layout.clockwise
    };
  }
};
function isZeroOnPolar(layout) {
  return layout.startAngle != null && layout.endAngle != null && layout.startAngle === layout.endAngle;
}
function createPolarPositionMapping(isRadial) {
  return (isRadial => {
    const arcOrAngle = isRadial ? 'Arc' : 'Angle';
    return position => {
      switch (position) {
        case 'start':
        case 'insideStart':
        case 'end':
        case 'insideEnd':
          return position + arcOrAngle;
        default:
          return position;
      }
    };
  })(isRadial);
}
function updateStyle(el, data, dataIndex, itemModel, layout, seriesModel, isHorizontalOrRadial, isPolar) {
  const style = data.getItemVisual(dataIndex, 'style');
  if (!isPolar) {
    const borderRadius = itemModel.get(['itemStyle', 'borderRadius']) || 0;
    el.setShape('r', borderRadius);
  } else if (!seriesModel.get('roundCap')) {
    const sectorShape = el.shape;
    const cornerRadius = getSectorCornerRadius(itemModel.getModel('itemStyle'), sectorShape, true);
    extend(sectorShape, cornerRadius);
    el.setShape(sectorShape);
  }
  el.useStyle(style);
  const cursorStyle = itemModel.getShallow('cursor');
  cursorStyle && el.attr('cursor', cursorStyle);
  const labelPositionOutside = isPolar ? isHorizontalOrRadial ? layout.r >= layout.r0 ? 'endArc' : 'startArc' : layout.endAngle >= layout.startAngle ? 'endAngle' : 'startAngle' : isHorizontalOrRadial ? layout.height >= 0 ? 'bottom' : 'top' : layout.width >= 0 ? 'right' : 'left';
  const labelStatesModels = getLabelStatesModels(itemModel);
  setLabelStyle(el, labelStatesModels, {
    labelFetcher: seriesModel,
    labelDataIndex: dataIndex,
    defaultText: getDefaultLabel(seriesModel.getData(), dataIndex),
    inheritColor: style.fill,
    defaultOpacity: style.opacity,
    defaultOutsidePosition: labelPositionOutside
  });
  const label = el.getTextContent();
  if (isPolar && label) {
    const position = itemModel.get(['label', 'position']);
    el.textConfig.inside = position === 'middle' ? true : null;
    setSectorTextRotation(el, position === 'outside' ? labelPositionOutside : position, createPolarPositionMapping(isHorizontalOrRadial), itemModel.get(['label', 'rotate']));
  }
  setLabelValueAnimation(label, labelStatesModels, seriesModel.getRawValue(dataIndex), value => getDefaultInterpolatedLabel(data, value));
  const emphasisModel = itemModel.getModel(['emphasis']);
  toggleHoverEmphasis(el, emphasisModel.get('focus'), emphasisModel.get('blurScope'), emphasisModel.get('disabled'));
  setStatesStylesFromModel(el, itemModel);
  if (isZeroOnPolar(layout)) {
    el.style.fill = 'none';
    el.style.stroke = 'none';
    each(el.states, state => {
      if (state.style) {
        state.style.fill = state.style.stroke = 'none';
      }
    });
  }
}
// In case width or height are too small.
function getLineWidth(itemModel, rawLayout) {
  // Has no border.
  const borderColor = itemModel.get(['itemStyle', 'borderColor']);
  if (!borderColor || borderColor === 'none') {
    return 0;
  }
  const lineWidth = itemModel.get(['itemStyle', 'borderWidth']) || 0;
  // width or height may be NaN for empty data
  const width = isNaN(rawLayout.width) ? Number.MAX_VALUE : Math.abs(rawLayout.width);
  const height = isNaN(rawLayout.height) ? Number.MAX_VALUE : Math.abs(rawLayout.height);
  return Math.min(lineWidth, width, height);
}
class LagePathShape {}
class LargePath extends Path {
  constructor(opts) {
    super(opts);
    this.type = 'largeBar';
  }
  getDefaultShape() {
    return new LagePathShape();
  }
  buildPath(ctx, shape) {
    // Drawing lines is more efficient than drawing
    // a whole line or drawing rects.
    const points = shape.points;
    const baseDimIdx = this.baseDimIdx;
    const valueDimIdx = 1 - this.baseDimIdx;
    const startPoint = [];
    const size = [];
    const barWidth = this.barWidth;
    for (let i = 0; i < points.length; i += 3) {
      size[baseDimIdx] = barWidth;
      size[valueDimIdx] = points[i + 2];
      startPoint[baseDimIdx] = points[i + baseDimIdx];
      startPoint[valueDimIdx] = points[i + valueDimIdx];
      ctx.rect(startPoint[0], startPoint[1], size[0], size[1]);
    }
  }
}
function createLarge(seriesModel, group, progressiveEls, incremental) {
  // TODO support polar
  const data = seriesModel.getData();
  const baseDimIdx = data.getLayout('valueAxisHorizontal') ? 1 : 0;
  const largeDataIndices = data.getLayout('largeDataIndices');
  const barWidth = data.getLayout('size');
  const backgroundModel = seriesModel.getModel('backgroundStyle');
  const bgPoints = data.getLayout('largeBackgroundPoints');
  if (bgPoints) {
    const bgEl = new LargePath({
      shape: {
        points: bgPoints
      },
      incremental: !!incremental,
      silent: true,
      z2: 0
    });
    bgEl.baseDimIdx = baseDimIdx;
    bgEl.largeDataIndices = largeDataIndices;
    bgEl.barWidth = barWidth;
    bgEl.useStyle(backgroundModel.getItemStyle());
    group.add(bgEl);
    progressiveEls && progressiveEls.push(bgEl);
  }
  const el = new LargePath({
    shape: {
      points: data.getLayout('largePoints')
    },
    incremental: !!incremental,
    ignoreCoarsePointer: true,
    z2: 1
  });
  el.baseDimIdx = baseDimIdx;
  el.largeDataIndices = largeDataIndices;
  el.barWidth = barWidth;
  group.add(el);
  el.useStyle(data.getVisual('style'));
  // Enable tooltip and user mouse/touch event handlers.
  getECData(el).seriesIndex = seriesModel.seriesIndex;
  if (!seriesModel.get('silent')) {
    el.on('mousedown', largePathUpdateDataIndex);
    el.on('mousemove', largePathUpdateDataIndex);
  }
  progressiveEls && progressiveEls.push(el);
}
// Use throttle to avoid frequently traverse to find dataIndex.
const largePathUpdateDataIndex = throttle(function (event) {
  const largePath = this;
  const dataIndex = largePathFindDataIndex(largePath, event.offsetX, event.offsetY);
  getECData(largePath).dataIndex = dataIndex >= 0 ? dataIndex : null;
}, 30, false);
function largePathFindDataIndex(largePath, x, y) {
  const baseDimIdx = largePath.baseDimIdx;
  const valueDimIdx = 1 - baseDimIdx;
  const points = largePath.shape.points;
  const largeDataIndices = largePath.largeDataIndices;
  const startPoint = [];
  const size = [];
  const barWidth = largePath.barWidth;
  for (let i = 0, len = points.length / 3; i < len; i++) {
    const ii = i * 3;
    size[baseDimIdx] = barWidth;
    size[valueDimIdx] = points[ii + 2];
    startPoint[baseDimIdx] = points[ii + baseDimIdx];
    startPoint[valueDimIdx] = points[ii + valueDimIdx];
    if (size[valueDimIdx] < 0) {
      startPoint[valueDimIdx] += size[valueDimIdx];
      size[valueDimIdx] = -size[valueDimIdx];
    }
    if (x >= startPoint[0] && x <= startPoint[0] + size[0] && y >= startPoint[1] && y <= startPoint[1] + size[1]) {
      return largeDataIndices[i];
    }
  }
  return -1;
}
function createBackgroundShape(isHorizontalOrRadial, layout, coord) {
  if (isCoordinateSystemType(coord, 'cartesian2d')) {
    const rectShape = layout;
    const coordLayout = coord.getArea();
    return {
      x: isHorizontalOrRadial ? rectShape.x : coordLayout.x,
      y: isHorizontalOrRadial ? coordLayout.y : rectShape.y,
      width: isHorizontalOrRadial ? rectShape.width : coordLayout.width,
      height: isHorizontalOrRadial ? coordLayout.height : rectShape.height
    };
  } else {
    const coordLayout = coord.getArea();
    const sectorShape = layout;
    return {
      cx: coordLayout.cx,
      cy: coordLayout.cy,
      r0: isHorizontalOrRadial ? coordLayout.r0 : sectorShape.r0,
      r: isHorizontalOrRadial ? coordLayout.r : sectorShape.r,
      startAngle: isHorizontalOrRadial ? sectorShape.startAngle : 0,
      endAngle: isHorizontalOrRadial ? sectorShape.endAngle : Math.PI * 2
    };
  }
}
function createBackgroundEl(coord, isHorizontalOrRadial, layout) {
  const ElementClz = coord.type === 'polar' ? Sector : Rect;
  return new ElementClz({
    shape: createBackgroundShape(isHorizontalOrRadial, layout, coord),
    silent: true,
    z2: 0
  });
}
export default BarView;