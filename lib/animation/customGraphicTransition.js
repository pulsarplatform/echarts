
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
import { makeInner, normalizeToArray } from '../util/model.js';
import { assert, bind, each, eqNaN, extend, hasOwn, indexOf, isArrayLike, keys, reduce } from 'zrender/lib/core/util.js';
import { cloneValue } from 'zrender/lib/animation/Animator.js';
import Displayable from 'zrender/lib/graphic/Displayable.js';
import { getAnimationConfig } from './basicTransition.js';
import { Path } from '../util/graphic.js';
import { warn } from '../util/log.js';
import { TRANSFORMABLE_PROPS } from 'zrender/lib/core/Transformable.js';
const LEGACY_TRANSFORM_PROPS_MAP = {
  position: ['x', 'y'],
  scale: ['scaleX', 'scaleY'],
  origin: ['originX', 'originY']
};
const LEGACY_TRANSFORM_PROPS = keys(LEGACY_TRANSFORM_PROPS_MAP);
const TRANSFORM_PROPS_MAP = reduce(TRANSFORMABLE_PROPS, (obj, key) => {
  obj[key] = 1;
  return obj;
}, {});
const transformPropNamesStr = TRANSFORMABLE_PROPS.join(', ');
// '' means root
export const ELEMENT_ANIMATABLE_PROPS = ['', 'style', 'shape', 'extra'];
;
const transitionInnerStore = makeInner();
;
function getElementAnimationConfig(animationType, el, elOption, parentModel, dataIndex) {
  const animationProp = `${animationType}Animation`;
  const config = getAnimationConfig(animationType, parentModel, dataIndex) || {};
  const userDuring = transitionInnerStore(el).userDuring;
  // Only set when duration is > 0 and it's need to be animated.
  if (config.duration > 0) {
    // For simplicity, if during not specified, the previous during will not work any more.
    config.during = userDuring ? bind(duringCall, {
      el: el,
      userDuring: userDuring
    }) : null;
    config.setToFinal = true;
    config.scope = animationType;
  }
  extend(config, elOption[animationProp]);
  return config;
}
export function applyUpdateTransition(el, elOption, animatableModel, opts) {
  opts = opts || {};
  const {
    dataIndex,
    isInit,
    clearStyle
  } = opts;
  const hasAnimation = animatableModel.isAnimationEnabled();
  // Save the meta info for further morphing. Like apply on the sub morphing elements.
  const store = transitionInnerStore(el);
  const styleOpt = elOption.style;
  store.userDuring = elOption.during;
  const transFromProps = {};
  const propsToSet = {};
  prepareTransformAllPropsFinal(el, elOption, propsToSet);
  prepareShapeOrExtraAllPropsFinal('shape', elOption, propsToSet);
  prepareShapeOrExtraAllPropsFinal('extra', elOption, propsToSet);
  if (!isInit && hasAnimation) {
    prepareTransformTransitionFrom(el, elOption, transFromProps);
    prepareShapeOrExtraTransitionFrom('shape', el, elOption, transFromProps);
    prepareShapeOrExtraTransitionFrom('extra', el, elOption, transFromProps);
    prepareStyleTransitionFrom(el, elOption, styleOpt, transFromProps);
  }
  propsToSet.style = styleOpt;
  applyPropsDirectly(el, propsToSet, clearStyle);
  applyMiscProps(el, elOption);
  if (hasAnimation) {
    if (isInit) {
      const enterFromProps = {};
      each(ELEMENT_ANIMATABLE_PROPS, propName => {
        const prop = propName ? elOption[propName] : elOption;
        if (prop && prop.enterFrom) {
          if (propName) {
            enterFromProps[propName] = enterFromProps[propName] || {};
          }
          extend(propName ? enterFromProps[propName] : enterFromProps, prop.enterFrom);
        }
      });
      const config = getElementAnimationConfig('enter', el, elOption, animatableModel, dataIndex);
      if (config.duration > 0) {
        el.animateFrom(enterFromProps, config);
      }
    } else {
      applyPropsTransition(el, elOption, dataIndex || 0, animatableModel, transFromProps);
    }
  }
  // Store leave to be used in leave transition.
  updateLeaveTo(el, elOption);
  styleOpt ? el.dirty() : el.markRedraw();
}
export function updateLeaveTo(el, elOption) {
  // Try merge to previous set leaveTo
  let leaveToProps = transitionInnerStore(el).leaveToProps;
  for (let i = 0; i < ELEMENT_ANIMATABLE_PROPS.length; i++) {
    const propName = ELEMENT_ANIMATABLE_PROPS[i];
    const prop = propName ? elOption[propName] : elOption;
    if (prop && prop.leaveTo) {
      if (!leaveToProps) {
        leaveToProps = transitionInnerStore(el).leaveToProps = {};
      }
      if (propName) {
        leaveToProps[propName] = leaveToProps[propName] || {};
      }
      extend(propName ? leaveToProps[propName] : leaveToProps, prop.leaveTo);
    }
  }
}
export function applyLeaveTransition(el, elOption, animatableModel, onRemove) {
  if (el) {
    const parent = el.parent;
    const leaveToProps = transitionInnerStore(el).leaveToProps;
    if (leaveToProps) {
      // TODO TODO use leave after leaveAnimation in series is introduced
      // TODO Data index?
      const config = getElementAnimationConfig('update', el, elOption, animatableModel, 0);
      config.done = () => {
        parent.remove(el);
        onRemove && onRemove();
      };
      el.animateTo(leaveToProps, config);
    } else {
      parent.remove(el);
      onRemove && onRemove();
    }
  }
}
export function isTransitionAll(transition) {
  return transition === 'all';
}
function applyPropsDirectly(el,
// Can be null/undefined
allPropsFinal, clearStyle) {
  const styleOpt = allPropsFinal.style;
  if (!el.isGroup && styleOpt) {
    if (clearStyle) {
      el.useStyle({});
      // When style object changed, how to trade the existing animation?
      // It is probably complicated and not needed to cover all the cases.
      // But still need consider the case:
      // (1) When using init animation on `style.opacity`, and before the animation
      //     ended users triggers an update by mousewhel. At that time the init
      //     animation should better be continued rather than terminated.
      //     So after `useStyle` called, we should change the animation target manually
      //     to continue the effect of the init animation.
      // (2) PENDING: If the previous animation targeted at a `val1`, and currently we need
      //     to update the value to `val2` and no animation declared, should be terminate
      //     the previous animation or just modify the target of the animation?
      //     Therotically That will happen not only on `style` but also on `shape` and
      //     `transfrom` props. But we haven't handle this case at present yet.
      // (3) PENDING: Is it proper to visit `animators` and `targetName`?
      const animators = el.animators;
      for (let i = 0; i < animators.length; i++) {
        const animator = animators[i];
        // targetName is the "topKey".
        if (animator.targetName === 'style') {
          animator.changeTarget(el.style);
        }
      }
    }
    el.setStyle(styleOpt);
  }
  if (allPropsFinal) {
    // Not set style here.
    allPropsFinal.style = null;
    // Set el to the final state firstly.
    allPropsFinal && el.attr(allPropsFinal);
    allPropsFinal.style = styleOpt;
  }
}
function applyPropsTransition(el, elOption, dataIndex, model,
// Can be null/undefined
transFromProps) {
  if (transFromProps) {
    const config = getElementAnimationConfig('update', el, elOption, model, dataIndex);
    if (config.duration > 0) {
      el.animateFrom(transFromProps, config);
    }
  }
}
function applyMiscProps(el, elOption) {
  // Merge by default.
  hasOwn(elOption, 'silent') && (el.silent = elOption.silent);
  hasOwn(elOption, 'ignore') && (el.ignore = elOption.ignore);
  if (el instanceof Displayable) {
    hasOwn(elOption, 'invisible') && (el.invisible = elOption.invisible);
  }
  if (el instanceof Path) {
    hasOwn(elOption, 'autoBatch') && (el.autoBatch = elOption.autoBatch);
  }
}
// Use it to avoid it be exposed to user.
const tmpDuringScope = {};
const transitionDuringAPI = {
  // Usually other props do not need to be changed in animation during.
  setTransform(key, val) {
    if (process.env.NODE_ENV !== 'production') {
      assert(hasOwn(TRANSFORM_PROPS_MAP, key), 'Only ' + transformPropNamesStr + ' available in `setTransform`.');
    }
    tmpDuringScope.el[key] = val;
    return this;
  },
  getTransform(key) {
    if (process.env.NODE_ENV !== 'production') {
      assert(hasOwn(TRANSFORM_PROPS_MAP, key), 'Only ' + transformPropNamesStr + ' available in `getTransform`.');
    }
    return tmpDuringScope.el[key];
  },
  setShape(key, val) {
    if (process.env.NODE_ENV !== 'production') {
      assertNotReserved(key);
    }
    const el = tmpDuringScope.el;
    const shape = el.shape || (el.shape = {});
    shape[key] = val;
    el.dirtyShape && el.dirtyShape();
    return this;
  },
  getShape(key) {
    if (process.env.NODE_ENV !== 'production') {
      assertNotReserved(key);
    }
    const shape = tmpDuringScope.el.shape;
    if (shape) {
      return shape[key];
    }
  },
  setStyle(key, val) {
    if (process.env.NODE_ENV !== 'production') {
      assertNotReserved(key);
    }
    const el = tmpDuringScope.el;
    const style = el.style;
    if (style) {
      if (process.env.NODE_ENV !== 'production') {
        if (eqNaN(val)) {
          warn('style.' + key + ' must not be assigned with NaN.');
        }
      }
      style[key] = val;
      el.dirtyStyle && el.dirtyStyle();
    }
    return this;
  },
  getStyle(key) {
    if (process.env.NODE_ENV !== 'production') {
      assertNotReserved(key);
    }
    const style = tmpDuringScope.el.style;
    if (style) {
      return style[key];
    }
  },
  setExtra(key, val) {
    if (process.env.NODE_ENV !== 'production') {
      assertNotReserved(key);
    }
    const extra = tmpDuringScope.el.extra || (tmpDuringScope.el.extra = {});
    extra[key] = val;
    return this;
  },
  getExtra(key) {
    if (process.env.NODE_ENV !== 'production') {
      assertNotReserved(key);
    }
    const extra = tmpDuringScope.el.extra;
    if (extra) {
      return extra[key];
    }
  }
};
function assertNotReserved(key) {
  if (process.env.NODE_ENV !== 'production') {
    if (key === 'transition' || key === 'enterFrom' || key === 'leaveTo') {
      throw new Error('key must not be "' + key + '"');
    }
  }
}
function duringCall() {
  // Do not provide "percent" until some requirements come.
  // Because consider thies case:
  // enterFrom: {x: 100, y: 30}, transition: 'x'.
  // And enter duration is different from update duration.
  // Thus it might be confused about the meaning of "percent" in during callback.
  const scope = this;
  const el = scope.el;
  if (!el) {
    return;
  }
  // If el is remove from zr by reason like legend, during still need to called,
  // because el will be added back to zr and the prop value should not be incorrect.
  const latestUserDuring = transitionInnerStore(el).userDuring;
  const scopeUserDuring = scope.userDuring;
  // Ensured a during is only called once in each animation frame.
  // If a during is called multiple times in one frame, maybe some users' calculation logic
  // might be wrong (not sure whether this usage exists).
  // The case of a during might be called twice can be: by default there is a animator for
  // 'x', 'y' when init. Before the init animation finished, call `setOption` to start
  // another animators for 'style'/'shape'/'extra'.
  if (latestUserDuring !== scopeUserDuring) {
    // release
    scope.el = scope.userDuring = null;
    return;
  }
  tmpDuringScope.el = el;
  // Give no `this` to user in "during" calling.
  scopeUserDuring(transitionDuringAPI);
  // FIXME: if in future meet the case that some prop will be both modified in `during` and `state`,
  // consider the issue that the prop might be incorrect when return to "normal" state.
}

function prepareShapeOrExtraTransitionFrom(mainAttr, fromEl, elOption, transFromProps) {
  const attrOpt = elOption[mainAttr];
  if (!attrOpt) {
    return;
  }
  const elPropsInAttr = fromEl[mainAttr];
  let transFromPropsInAttr;
  if (elPropsInAttr) {
    const transition = elOption.transition;
    const attrTransition = attrOpt.transition;
    if (attrTransition) {
      !transFromPropsInAttr && (transFromPropsInAttr = transFromProps[mainAttr] = {});
      if (isTransitionAll(attrTransition)) {
        extend(transFromPropsInAttr, elPropsInAttr);
      } else {
        const transitionKeys = normalizeToArray(attrTransition);
        for (let i = 0; i < transitionKeys.length; i++) {
          const key = transitionKeys[i];
          const elVal = elPropsInAttr[key];
          transFromPropsInAttr[key] = elVal;
        }
      }
    } else if (isTransitionAll(transition) || indexOf(transition, mainAttr) >= 0) {
      !transFromPropsInAttr && (transFromPropsInAttr = transFromProps[mainAttr] = {});
      const elPropsInAttrKeys = keys(elPropsInAttr);
      for (let i = 0; i < elPropsInAttrKeys.length; i++) {
        const key = elPropsInAttrKeys[i];
        const elVal = elPropsInAttr[key];
        if (isNonStyleTransitionEnabled(attrOpt[key], elVal)) {
          transFromPropsInAttr[key] = elVal;
        }
      }
    }
  }
}
function prepareShapeOrExtraAllPropsFinal(mainAttr, elOption, allProps) {
  const attrOpt = elOption[mainAttr];
  if (!attrOpt) {
    return;
  }
  const allPropsInAttr = allProps[mainAttr] = {};
  const keysInAttr = keys(attrOpt);
  for (let i = 0; i < keysInAttr.length; i++) {
    const key = keysInAttr[i];
    // To avoid share one object with different element, and
    // to avoid user modify the object inexpectedly, have to clone.
    allPropsInAttr[key] = cloneValue(attrOpt[key]);
  }
}
function prepareTransformTransitionFrom(el, elOption, transFromProps) {
  const transition = elOption.transition;
  const transitionKeys = isTransitionAll(transition) ? TRANSFORMABLE_PROPS : normalizeToArray(transition || []);
  for (let i = 0; i < transitionKeys.length; i++) {
    const key = transitionKeys[i];
    if (key === 'style' || key === 'shape' || key === 'extra') {
      continue;
    }
    const elVal = el[key];
    if (process.env.NODE_ENV !== 'production') {
      checkTransformPropRefer(key, 'el.transition');
    }
    // Do not clone, animator will perform that clone.
    transFromProps[key] = elVal;
  }
}
function prepareTransformAllPropsFinal(el, elOption, allProps) {
  for (let i = 0; i < LEGACY_TRANSFORM_PROPS.length; i++) {
    const legacyName = LEGACY_TRANSFORM_PROPS[i];
    const xyName = LEGACY_TRANSFORM_PROPS_MAP[legacyName];
    const legacyArr = elOption[legacyName];
    if (legacyArr) {
      allProps[xyName[0]] = legacyArr[0];
      allProps[xyName[1]] = legacyArr[1];
    }
  }
  for (let i = 0; i < TRANSFORMABLE_PROPS.length; i++) {
    const key = TRANSFORMABLE_PROPS[i];
    if (elOption[key] != null) {
      allProps[key] = elOption[key];
    }
  }
}
function prepareStyleTransitionFrom(fromEl, elOption, styleOpt, transFromProps) {
  if (!styleOpt) {
    return;
  }
  const fromElStyle = fromEl.style;
  let transFromStyleProps;
  if (fromElStyle) {
    const styleTransition = styleOpt.transition;
    const elTransition = elOption.transition;
    if (styleTransition && !isTransitionAll(styleTransition)) {
      const transitionKeys = normalizeToArray(styleTransition);
      !transFromStyleProps && (transFromStyleProps = transFromProps.style = {});
      for (let i = 0; i < transitionKeys.length; i++) {
        const key = transitionKeys[i];
        const elVal = fromElStyle[key];
        // Do not clone, see `checkNonStyleTansitionRefer`.
        transFromStyleProps[key] = elVal;
      }
    } else if (fromEl.getAnimationStyleProps && (isTransitionAll(elTransition) || isTransitionAll(styleTransition) || indexOf(elTransition, 'style') >= 0)) {
      const animationProps = fromEl.getAnimationStyleProps();
      const animationStyleProps = animationProps ? animationProps.style : null;
      if (animationStyleProps) {
        !transFromStyleProps && (transFromStyleProps = transFromProps.style = {});
        const styleKeys = keys(styleOpt);
        for (let i = 0; i < styleKeys.length; i++) {
          const key = styleKeys[i];
          if (animationStyleProps[key]) {
            const elVal = fromElStyle[key];
            transFromStyleProps[key] = elVal;
          }
        }
      }
    }
  }
}
function isNonStyleTransitionEnabled(optVal, elVal) {
  // The same as `checkNonStyleTansitionRefer`.
  return !isArrayLike(optVal) ? optVal != null && isFinite(optVal) : optVal !== elVal;
}
let checkTransformPropRefer;
if (process.env.NODE_ENV !== 'production') {
  checkTransformPropRefer = function (key, usedIn) {
    if (!hasOwn(TRANSFORM_PROPS_MAP, key)) {
      warn('Prop `' + key + '` is not a permitted in `' + usedIn + '`. ' + 'Only `' + keys(TRANSFORM_PROPS_MAP).join('`, `') + '` are permitted.');
    }
  };
}