
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
import Displayable from 'zrender/lib/graphic/Displayable.js';
import * as modelUtil from '../../util/model.js';
import * as graphicUtil from '../../util/graphic.js';
import * as layoutUtil from '../../util/layout.js';
import { parsePercent } from '../../util/number.js';
import ComponentView from '../../view/Component.js';
import { getECData } from '../../util/innerStore.js';
import { isEC4CompatibleStyle, convertFromEC4CompatibleStyle } from '../../util/styleCompat.js';
import { applyLeaveTransition, applyUpdateTransition, isTransitionAll, updateLeaveTo } from '../../animation/customGraphicTransition.js';
import { updateProps } from '../../animation/basicTransition.js';
import { applyKeyframeAnimation, stopPreviousKeyframeAnimationAndRestore } from '../../animation/customGraphicKeyframeAnimation.js';
const nonShapeGraphicElements = {
  // Reserved but not supported in graphic component.
  path: null,
  compoundPath: null,
  // Supported in graphic component.
  group: graphicUtil.Group,
  image: graphicUtil.Image,
  text: graphicUtil.Text
};
export const inner = modelUtil.makeInner();
// ------------------------
// View
// ------------------------
export class GraphicComponentView extends ComponentView {
  constructor() {
    super(...arguments);
    this.type = GraphicComponentView.type;
  }
  init() {
    this._elMap = zrUtil.createHashMap();
  }
  render(graphicModel, ecModel, api) {
    // Having leveraged between use cases and algorithm complexity, a very
    // simple layout mechanism is used:
    // The size(width/height) can be determined by itself or its parent (not
    // implemented yet), but can not by its children. (Top-down travel)
    // The location(x/y) can be determined by the bounding rect of itself
    // (can including its descendants or not) and the size of its parent.
    // (Bottom-up travel)
    // When `chart.clear()` or `chart.setOption({...}, true)` with the same id,
    // view will be reused.
    if (graphicModel !== this._lastGraphicModel) {
      this._clear();
    }
    this._lastGraphicModel = graphicModel;
    this._updateElements(graphicModel);
    this._relocate(graphicModel, api);
  }
  /**
   * Update graphic elements.
   */
  _updateElements(graphicModel) {
    const elOptionsToUpdate = graphicModel.useElOptionsToUpdate();
    if (!elOptionsToUpdate) {
      return;
    }
    const elMap = this._elMap;
    const rootGroup = this.group;
    const globalZ = graphicModel.get('z');
    const globalZLevel = graphicModel.get('zlevel');
    // Top-down tranverse to assign graphic settings to each elements.
    zrUtil.each(elOptionsToUpdate, function (elOption) {
      const id = modelUtil.convertOptionIdName(elOption.id, null);
      const elExisting = id != null ? elMap.get(id) : null;
      const parentId = modelUtil.convertOptionIdName(elOption.parentId, null);
      const targetElParent = parentId != null ? elMap.get(parentId) : rootGroup;
      const elType = elOption.type;
      const elOptionStyle = elOption.style;
      if (elType === 'text' && elOptionStyle) {
        // In top/bottom mode, textVerticalAlign should not be used, which cause
        // inaccurately locating.
        if (elOption.hv && elOption.hv[1]) {
          elOptionStyle.textVerticalAlign = elOptionStyle.textBaseline = elOptionStyle.verticalAlign = elOptionStyle.align = null;
        }
      }
      let textContentOption = elOption.textContent;
      let textConfig = elOption.textConfig;
      if (elOptionStyle && isEC4CompatibleStyle(elOptionStyle, elType, !!textConfig, !!textContentOption)) {
        const convertResult = convertFromEC4CompatibleStyle(elOptionStyle, elType, true);
        if (!textConfig && convertResult.textConfig) {
          textConfig = elOption.textConfig = convertResult.textConfig;
        }
        if (!textContentOption && convertResult.textContent) {
          textContentOption = convertResult.textContent;
        }
      }
      // Remove unnecessary props to avoid potential problems.
      const elOptionCleaned = getCleanedElOption(elOption);
      // For simple, do not support parent change, otherwise reorder is needed.
      if (process.env.NODE_ENV !== 'production') {
        elExisting && zrUtil.assert(targetElParent === elExisting.parent, 'Changing parent is not supported.');
      }
      const $action = elOption.$action || 'merge';
      const isMerge = $action === 'merge';
      const isReplace = $action === 'replace';
      if (isMerge) {
        const isInit = !elExisting;
        let el = elExisting;
        if (isInit) {
          el = createEl(id, targetElParent, elOption.type, elMap);
        } else {
          el && (inner(el).isNew = false);
          // Stop and restore before update any other attributes.
          stopPreviousKeyframeAnimationAndRestore(el);
        }
        if (el) {
          applyUpdateTransition(el, elOptionCleaned, graphicModel, {
            isInit
          });
          updateCommonAttrs(el, elOption, globalZ, globalZLevel);
        }
      } else if (isReplace) {
        removeEl(elExisting, elOption, elMap, graphicModel);
        const el = createEl(id, targetElParent, elOption.type, elMap);
        if (el) {
          applyUpdateTransition(el, elOptionCleaned, graphicModel, {
            isInit: true
          });
          updateCommonAttrs(el, elOption, globalZ, globalZLevel);
        }
      } else if ($action === 'remove') {
        updateLeaveTo(elExisting, elOption);
        removeEl(elExisting, elOption, elMap, graphicModel);
      }
      const el = elMap.get(id);
      if (el && textContentOption) {
        if (isMerge) {
          const textContentExisting = el.getTextContent();
          textContentExisting ? textContentExisting.attr(textContentOption) : el.setTextContent(new graphicUtil.Text(textContentOption));
        } else if (isReplace) {
          el.setTextContent(new graphicUtil.Text(textContentOption));
        }
      }
      if (el) {
        const clipPathOption = elOption.clipPath;
        if (clipPathOption) {
          const clipPathType = clipPathOption.type;
          let clipPath;
          let isInit = false;
          if (isMerge) {
            const oldClipPath = el.getClipPath();
            isInit = !oldClipPath || inner(oldClipPath).type !== clipPathType;
            clipPath = isInit ? newEl(clipPathType) : oldClipPath;
          } else if (isReplace) {
            isInit = true;
            clipPath = newEl(clipPathType);
          }
          el.setClipPath(clipPath);
          applyUpdateTransition(clipPath, clipPathOption, graphicModel, {
            isInit
          });
          applyKeyframeAnimation(clipPath, clipPathOption.keyframeAnimation, graphicModel);
        }
        const elInner = inner(el);
        el.setTextConfig(textConfig);
        elInner.option = elOption;
        setEventData(el, graphicModel, elOption);
        graphicUtil.setTooltipConfig({
          el: el,
          componentModel: graphicModel,
          itemName: el.name,
          itemTooltipOption: elOption.tooltip
        });
        applyKeyframeAnimation(el, elOption.keyframeAnimation, graphicModel);
      }
    });
  }
  /**
   * Locate graphic elements.
   */
  _relocate(graphicModel, api) {
    const elOptions = graphicModel.option.elements;
    const rootGroup = this.group;
    const elMap = this._elMap;
    const apiWidth = api.getWidth();
    const apiHeight = api.getHeight();
    const xy = ['x', 'y'];
    // Top-down to calculate percentage width/height of group
    for (let i = 0; i < elOptions.length; i++) {
      const elOption = elOptions[i];
      const id = modelUtil.convertOptionIdName(elOption.id, null);
      const el = id != null ? elMap.get(id) : null;
      if (!el || !el.isGroup) {
        continue;
      }
      const parentEl = el.parent;
      const isParentRoot = parentEl === rootGroup;
      // Like 'position:absolut' in css, default 0.
      const elInner = inner(el);
      const parentElInner = inner(parentEl);
      elInner.width = parsePercent(elInner.option.width, isParentRoot ? apiWidth : parentElInner.width) || 0;
      elInner.height = parsePercent(elInner.option.height, isParentRoot ? apiHeight : parentElInner.height) || 0;
    }
    // Bottom-up tranvese all elements (consider ec resize) to locate elements.
    for (let i = elOptions.length - 1; i >= 0; i--) {
      const elOption = elOptions[i];
      const id = modelUtil.convertOptionIdName(elOption.id, null);
      const el = id != null ? elMap.get(id) : null;
      if (!el) {
        continue;
      }
      const parentEl = el.parent;
      const parentElInner = inner(parentEl);
      const containerInfo = parentEl === rootGroup ? {
        width: apiWidth,
        height: apiHeight
      } : {
        width: parentElInner.width,
        height: parentElInner.height
      };
      // PENDING
      // Currently, when `bounding: 'all'`, the union bounding rect of the group
      // does not include the rect of [0, 0, group.width, group.height], which
      // is probably weird for users. Should we make a break change for it?
      const layoutPos = {};
      const layouted = layoutUtil.positionElement(el, elOption, containerInfo, null, {
        hv: elOption.hv,
        boundingMode: elOption.bounding
      }, layoutPos);
      if (!inner(el).isNew && layouted) {
        const transition = elOption.transition;
        const animatePos = {};
        for (let k = 0; k < xy.length; k++) {
          const key = xy[k];
          const val = layoutPos[key];
          if (transition && (isTransitionAll(transition) || zrUtil.indexOf(transition, key) >= 0)) {
            animatePos[key] = val;
          } else {
            el[key] = val;
          }
        }
        updateProps(el, animatePos, graphicModel, 0);
      } else {
        el.attr(layoutPos);
      }
    }
  }
  /**
   * Clear all elements.
   */
  _clear() {
    const elMap = this._elMap;
    elMap.each(el => {
      removeEl(el, inner(el).option, elMap, this._lastGraphicModel);
    });
    this._elMap = zrUtil.createHashMap();
  }
  dispose() {
    this._clear();
  }
}
GraphicComponentView.type = 'graphic';
function newEl(graphicType) {
  if (process.env.NODE_ENV !== 'production') {
    zrUtil.assert(graphicType, 'graphic type MUST be set');
  }
  const Clz = zrUtil.hasOwn(nonShapeGraphicElements, graphicType)
  // Those graphic elements are not shapes. They should not be
  // overwritten by users, so do them first.
  ? nonShapeGraphicElements[graphicType] : graphicUtil.getShapeClass(graphicType);
  if (process.env.NODE_ENV !== 'production') {
    zrUtil.assert(Clz, `graphic type ${graphicType} can not be found`);
  }
  const el = new Clz({});
  inner(el).type = graphicType;
  return el;
}
function createEl(id, targetElParent, graphicType, elMap) {
  const el = newEl(graphicType);
  targetElParent.add(el);
  elMap.set(id, el);
  inner(el).id = id;
  inner(el).isNew = true;
  return el;
}
function removeEl(elExisting, elOption, elMap, graphicModel) {
  const existElParent = elExisting && elExisting.parent;
  if (existElParent) {
    elExisting.type === 'group' && elExisting.traverse(function (el) {
      removeEl(el, elOption, elMap, graphicModel);
    });
    applyLeaveTransition(elExisting, elOption, graphicModel);
    elMap.removeKey(inner(elExisting).id);
  }
}
function updateCommonAttrs(el, elOption, defaultZ, defaultZlevel) {
  if (!el.isGroup) {
    zrUtil.each([['cursor', Displayable.prototype.cursor],
    // We should not support configure z and zlevel in the element level.
    // But seems we didn't limit it previously. So here still use it to avoid breaking.
    ['zlevel', defaultZlevel || 0], ['z', defaultZ || 0],
    // z2 must not be null/undefined, otherwise sort error may occur.
    ['z2', 0]], item => {
      const prop = item[0];
      if (zrUtil.hasOwn(elOption, prop)) {
        el[prop] = zrUtil.retrieve2(elOption[prop], item[1]);
      } else if (el[prop] == null) {
        el[prop] = item[1];
      }
    });
  }
  zrUtil.each(zrUtil.keys(elOption), key => {
    // Assign event handlers.
    // PENDING: should enumerate all event names or use pattern matching?
    if (key.indexOf('on') === 0) {
      const val = elOption[key];
      el[key] = zrUtil.isFunction(val) ? val : null;
    }
  });
  if (zrUtil.hasOwn(elOption, 'draggable')) {
    el.draggable = elOption.draggable;
  }
  // Other attributes
  elOption.name != null && (el.name = elOption.name);
  elOption.id != null && (el.id = elOption.id);
}
// Remove unnecessary props to avoid potential problems.
function getCleanedElOption(elOption) {
  elOption = zrUtil.extend({}, elOption);
  zrUtil.each(['id', 'parentId', '$action', 'hv', 'bounding', 'textContent', 'clipPath'].concat(layoutUtil.LOCATION_PARAMS), function (name) {
    delete elOption[name];
  });
  return elOption;
}
function setEventData(el, graphicModel, elOption) {
  let eventData = getECData(el).eventData;
  // Simple optimize for large amount of elements that no need event.
  if (!el.silent && !el.ignore && !eventData) {
    eventData = getECData(el).eventData = {
      componentType: 'graphic',
      componentIndex: graphicModel.componentIndex,
      name: el.name
    };
  }
  // `elOption.info` enables user to mount some info on
  // elements and use them in event handlers.
  if (eventData) {
    eventData.info = elOption.info;
  }
}