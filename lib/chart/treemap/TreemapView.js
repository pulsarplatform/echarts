
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
import { bind, each, indexOf, curry, extend, normalizeCssArray, isFunction } from 'zrender/lib/core/util.js';
import * as graphic from '../../util/graphic.js';
import { getECData } from '../../util/innerStore.js';
import { isHighDownDispatcher, setAsHighDownDispatcher, setDefaultStateProxy, enableHoverFocus, Z2_EMPHASIS_LIFT } from '../../util/states.js';
import DataDiffer from '../../data/DataDiffer.js';
import * as helper from '../helper/treeHelper.js';
import Breadcrumb from './Breadcrumb.js';
import RoamController from '../../component/helper/RoamController.js';
import BoundingRect from 'zrender/lib/core/BoundingRect.js';
import * as matrix from 'zrender/lib/core/matrix.js';
import * as animationUtil from '../../util/animation.js';
import makeStyleMapper from '../../model/mixin/makeStyleMapper.js';
import ChartView from '../../view/Chart.js';
import Displayable from 'zrender/lib/graphic/Displayable.js';
import { makeInner, convertOptionIdName } from '../../util/model.js';
import { windowOpen } from '../../util/format.js';
import { setLabelStyle, getLabelStatesModels } from '../../label/labelStyle.js';
const Group = graphic.Group;
const Rect = graphic.Rect;
const DRAG_THRESHOLD = 3;
const PATH_LABEL_NOAMAL = 'label';
const PATH_UPPERLABEL_NORMAL = 'upperLabel';
// Should larger than emphasis states lift z
const Z2_BASE = Z2_EMPHASIS_LIFT * 10; // Should bigger than every z2.
const Z2_BG = Z2_EMPHASIS_LIFT * 2;
const Z2_CONTENT = Z2_EMPHASIS_LIFT * 3;
const getStateItemStyle = makeStyleMapper([['fill', 'color'],
// `borderColor` and `borderWidth` has been occupied,
// so use `stroke` to indicate the stroke of the rect.
['stroke', 'strokeColor'], ['lineWidth', 'strokeWidth'], ['shadowBlur'], ['shadowOffsetX'], ['shadowOffsetY'], ['shadowColor']
// Option decal is in `DecalObject` but style.decal is in `PatternObject`.
// So do not transfer decal directly.
]);

const getItemStyleNormal = function (model) {
  // Normal style props should include emphasis style props.
  const itemStyle = getStateItemStyle(model);
  // Clear styles set by emphasis.
  itemStyle.stroke = itemStyle.fill = itemStyle.lineWidth = null;
  return itemStyle;
};
const inner = makeInner();
class TreemapView extends ChartView {
  constructor() {
    super(...arguments);
    this.type = TreemapView.type;
    this._state = 'ready';
    this._storage = createStorage();
  }
  /**
   * @override
   */
  render(seriesModel, ecModel, api, payload) {
    const models = ecModel.findComponents({
      mainType: 'series',
      subType: 'treemap',
      query: payload
    });
    if (indexOf(models, seriesModel) < 0) {
      return;
    }
    this.seriesModel = seriesModel;
    this.api = api;
    this.ecModel = ecModel;
    const types = ['treemapZoomToNode', 'treemapRootToNode'];
    const targetInfo = helper.retrieveTargetInfo(payload, types, seriesModel);
    const payloadType = payload && payload.type;
    const layoutInfo = seriesModel.layoutInfo;
    const isInit = !this._oldTree;
    const thisStorage = this._storage;
    // Mark new root when action is treemapRootToNode.
    const reRoot = payloadType === 'treemapRootToNode' && targetInfo && thisStorage ? {
      rootNodeGroup: thisStorage.nodeGroup[targetInfo.node.getRawIndex()],
      direction: payload.direction
    } : null;
    const containerGroup = this._giveContainerGroup(layoutInfo);
    const hasAnimation = seriesModel.get('animation');
    const renderResult = this._doRender(containerGroup, seriesModel, reRoot);
    hasAnimation && !isInit && (!payloadType || payloadType === 'treemapZoomToNode' || payloadType === 'treemapRootToNode') ? this._doAnimation(containerGroup, renderResult, seriesModel, reRoot) : renderResult.renderFinally();
    this._resetController(api);
    this._renderBreadcrumb(seriesModel, api, targetInfo);
  }
  _giveContainerGroup(layoutInfo) {
    let containerGroup = this._containerGroup;
    if (!containerGroup) {
      // FIXME
      // 加一层containerGroup是为了clip，但是现在clip功能并没有实现。
      containerGroup = this._containerGroup = new Group();
      this._initEvents(containerGroup);
      this.group.add(containerGroup);
    }
    containerGroup.x = layoutInfo.x;
    containerGroup.y = layoutInfo.y;
    return containerGroup;
  }
  _doRender(containerGroup, seriesModel, reRoot) {
    const thisTree = seriesModel.getData().tree;
    const oldTree = this._oldTree;
    // Clear last shape records.
    const lastsForAnimation = createStorage();
    const thisStorage = createStorage();
    const oldStorage = this._storage;
    const willInvisibleEls = [];
    function doRenderNode(thisNode, oldNode, parentGroup, depth) {
      return renderNode(seriesModel, thisStorage, oldStorage, reRoot, lastsForAnimation, willInvisibleEls, thisNode, oldNode, parentGroup, depth);
    }
    // Notice: When thisTree and oldTree are the same tree (see list.cloneShallow),
    // the oldTree is actually losted, so we cannot find all of the old graphic
    // elements from tree. So we use this strategy: make element storage, move
    // from old storage to new storage, clear old storage.
    dualTravel(thisTree.root ? [thisTree.root] : [], oldTree && oldTree.root ? [oldTree.root] : [], containerGroup, thisTree === oldTree || !oldTree, 0);
    // Process all removing.
    const willDeleteEls = clearStorage(oldStorage);
    this._oldTree = thisTree;
    this._storage = thisStorage;
    if (this._controllerHost) {
      const _oldRootLayout = this.seriesModel.layoutInfo;
      const rootLayout = thisTree.root.getLayout();
      if (rootLayout.width === _oldRootLayout.width && rootLayout.height === _oldRootLayout.height) {
        this._controllerHost.zoom = 1;
      }
    }
    return {
      lastsForAnimation,
      willDeleteEls,
      renderFinally
    };
    function dualTravel(thisViewChildren, oldViewChildren, parentGroup, sameTree, depth) {
      // When 'render' is triggered by action,
      // 'this' and 'old' may be the same tree,
      // we use rawIndex in that case.
      if (sameTree) {
        oldViewChildren = thisViewChildren;
        each(thisViewChildren, function (child, index) {
          !child.isRemoved() && processNode(index, index);
        });
      }
      // Diff hierarchically (diff only in each subtree, but not whole).
      // because, consistency of view is important.
      else {
        new DataDiffer(oldViewChildren, thisViewChildren, getKey, getKey).add(processNode).update(processNode).remove(curry(processNode, null)).execute();
      }
      function getKey(node) {
        // Identify by name or raw index.
        return node.getId();
      }
      function processNode(newIndex, oldIndex) {
        const thisNode = newIndex != null ? thisViewChildren[newIndex] : null;
        const oldNode = oldIndex != null ? oldViewChildren[oldIndex] : null;
        const group = doRenderNode(thisNode, oldNode, parentGroup, depth);
        group && dualTravel(thisNode && thisNode.viewChildren || [], oldNode && oldNode.viewChildren || [], group, sameTree, depth + 1);
      }
    }
    function clearStorage(storage) {
      const willDeleteEls = createStorage();
      storage && each(storage, function (store, storageName) {
        const delEls = willDeleteEls[storageName];
        each(store, function (el) {
          el && (delEls.push(el), inner(el).willDelete = true);
        });
      });
      return willDeleteEls;
    }
    function renderFinally() {
      each(willDeleteEls, function (els) {
        each(els, function (el) {
          el.parent && el.parent.remove(el);
        });
      });
      each(willInvisibleEls, function (el) {
        el.invisible = true;
        // Setting invisible is for optimizing, so no need to set dirty,
        // just mark as invisible.
        el.dirty();
      });
    }
  }
  _doAnimation(containerGroup, renderResult, seriesModel, reRoot) {
    const durationOption = seriesModel.get('animationDurationUpdate');
    const easingOption = seriesModel.get('animationEasing');
    // TODO: do not support function until necessary.
    const duration = (isFunction(durationOption) ? 0 : durationOption) || 0;
    const easing = (isFunction(easingOption) ? null : easingOption) || 'cubicOut';
    const animationWrap = animationUtil.createWrap();
    // Make delete animations.
    each(renderResult.willDeleteEls, function (store, storageName) {
      each(store, function (el, rawIndex) {
        if (el.invisible) {
          return;
        }
        const parent = el.parent; // Always has parent, and parent is nodeGroup.
        let target;
        const innerStore = inner(parent);
        if (reRoot && reRoot.direction === 'drillDown') {
          target = parent === reRoot.rootNodeGroup
          // This is the content element of view root.
          // Only `content` will enter this branch, because
          // `background` and `nodeGroup` will not be deleted.
          ? {
            shape: {
              x: 0,
              y: 0,
              width: innerStore.nodeWidth,
              height: innerStore.nodeHeight
            },
            style: {
              opacity: 0
            }
          }
          // Others.
          : {
            style: {
              opacity: 0
            }
          };
        } else {
          let targetX = 0;
          let targetY = 0;
          if (!innerStore.willDelete) {
            // Let node animate to right-bottom corner, cooperating with fadeout,
            // which is appropriate for user understanding.
            // Divided by 2 for reRoot rolling up effect.
            targetX = innerStore.nodeWidth / 2;
            targetY = innerStore.nodeHeight / 2;
          }
          target = storageName === 'nodeGroup' ? {
            x: targetX,
            y: targetY,
            style: {
              opacity: 0
            }
          } : {
            shape: {
              x: targetX,
              y: targetY,
              width: 0,
              height: 0
            },
            style: {
              opacity: 0
            }
          };
        }
        // TODO: do not support delay until necessary.
        target && animationWrap.add(el, target, duration, 0, easing);
      });
    });
    // Make other animations
    each(this._storage, function (store, storageName) {
      each(store, function (el, rawIndex) {
        const last = renderResult.lastsForAnimation[storageName][rawIndex];
        const target = {};
        if (!last) {
          return;
        }
        if (el instanceof graphic.Group) {
          if (last.oldX != null) {
            target.x = el.x;
            target.y = el.y;
            el.x = last.oldX;
            el.y = last.oldY;
          }
        } else {
          if (last.oldShape) {
            target.shape = extend({}, el.shape);
            el.setShape(last.oldShape);
          }
          if (last.fadein) {
            el.setStyle('opacity', 0);
            target.style = {
              opacity: 1
            };
          }
          // When animation is stopped for succedent animation starting,
          // el.style.opacity might not be 1
          else if (el.style.opacity !== 1) {
            target.style = {
              opacity: 1
            };
          }
        }
        animationWrap.add(el, target, duration, 0, easing);
      });
    }, this);
    this._state = 'animating';
    animationWrap.finished(bind(function () {
      this._state = 'ready';
      renderResult.renderFinally();
    }, this)).start();
  }
  _resetController(api) {
    let controller = this._controller;
    let controllerHost = this._controllerHost;
    if (!controllerHost) {
      this._controllerHost = {
        target: this.group
      };
      controllerHost = this._controllerHost;
    }
    // Init controller.
    if (!controller) {
      controller = this._controller = new RoamController(api.getZr());
      controller.enable(this.seriesModel.get('roam'));
      controllerHost.zoomLimit = this.seriesModel.get('scaleLimit');
      controllerHost.zoom = this.seriesModel.get('zoom');
      controller.on('pan', bind(this._onPan, this));
      controller.on('zoom', bind(this._onZoom, this));
    }
    const rect = new BoundingRect(0, 0, api.getWidth(), api.getHeight());
    controller.setPointerChecker(function (e, x, y) {
      return rect.contain(x, y);
    });
  }
  _clearController() {
    let controller = this._controller;
    this._controllerHost = null;
    if (controller) {
      controller.dispose();
      controller = null;
    }
  }
  _onPan(e) {
    if (this._state !== 'animating' && (Math.abs(e.dx) > DRAG_THRESHOLD || Math.abs(e.dy) > DRAG_THRESHOLD)) {
      // These param must not be cached.
      const root = this.seriesModel.getData().tree.root;
      if (!root) {
        return;
      }
      const rootLayout = root.getLayout();
      if (!rootLayout) {
        return;
      }
      this.api.dispatchAction({
        type: 'treemapMove',
        from: this.uid,
        seriesId: this.seriesModel.id,
        rootRect: {
          x: rootLayout.x + e.dx,
          y: rootLayout.y + e.dy,
          width: rootLayout.width,
          height: rootLayout.height
        }
      });
    }
  }
  _onZoom(e) {
    let mouseX = e.originX;
    let mouseY = e.originY;
    const zoomDelta = e.scale;
    if (this._state !== 'animating') {
      // These param must not be cached.
      const root = this.seriesModel.getData().tree.root;
      if (!root) {
        return;
      }
      const rootLayout = root.getLayout();
      if (!rootLayout) {
        return;
      }
      const rect = new BoundingRect(rootLayout.x, rootLayout.y, rootLayout.width, rootLayout.height);
      // scaleLimit
      let zoomLimit = null;
      const _controllerHost = this._controllerHost;
      zoomLimit = _controllerHost.zoomLimit;
      let newZoom = _controllerHost.zoom = _controllerHost.zoom || 1;
      newZoom *= zoomDelta;
      if (zoomLimit) {
        const zoomMin = zoomLimit.min || 0;
        const zoomMax = zoomLimit.max || Infinity;
        newZoom = Math.max(Math.min(zoomMax, newZoom), zoomMin);
      }
      const zoomScale = newZoom / _controllerHost.zoom;
      _controllerHost.zoom = newZoom;
      const layoutInfo = this.seriesModel.layoutInfo;
      // Transform mouse coord from global to containerGroup.
      mouseX -= layoutInfo.x;
      mouseY -= layoutInfo.y;
      // Scale root bounding rect.
      const m = matrix.create();
      matrix.translate(m, m, [-mouseX, -mouseY]);
      matrix.scale(m, m, [zoomScale, zoomScale]);
      matrix.translate(m, m, [mouseX, mouseY]);
      rect.applyTransform(m);
      this.api.dispatchAction({
        type: 'treemapRender',
        from: this.uid,
        seriesId: this.seriesModel.id,
        rootRect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      });
    }
  }
  _initEvents(containerGroup) {
    containerGroup.on('click', e => {
      if (this._state !== 'ready') {
        return;
      }
      const nodeClick = this.seriesModel.get('nodeClick', true);
      if (!nodeClick) {
        return;
      }
      const targetInfo = this.findTarget(e.offsetX, e.offsetY);
      if (!targetInfo) {
        return;
      }
      const node = targetInfo.node;
      if (node.getLayout().isLeafRoot) {
        this._rootToNode(targetInfo);
      } else {
        if (nodeClick === 'zoomToNode') {
          this._zoomToNode(targetInfo);
        } else if (nodeClick === 'link') {
          const itemModel = node.hostTree.data.getItemModel(node.dataIndex);
          const link = itemModel.get('link', true);
          const linkTarget = itemModel.get('target', true) || 'blank';
          link && windowOpen(link, linkTarget);
        }
      }
    }, this);
  }
  _renderBreadcrumb(seriesModel, api, targetInfo) {
    if (!targetInfo) {
      targetInfo = seriesModel.get('leafDepth', true) != null ? {
        node: seriesModel.getViewRoot()
      }
      // FIXME
      // better way?
      // Find breadcrumb tail on center of containerGroup.
      : this.findTarget(api.getWidth() / 2, api.getHeight() / 2);
      if (!targetInfo) {
        targetInfo = {
          node: seriesModel.getData().tree.root
        };
      }
    }
    (this._breadcrumb || (this._breadcrumb = new Breadcrumb(this.group))).render(seriesModel, api, targetInfo.node, node => {
      if (this._state !== 'animating') {
        helper.aboveViewRoot(seriesModel.getViewRoot(), node) ? this._rootToNode({
          node: node
        }) : this._zoomToNode({
          node: node
        });
      }
    });
  }
  /**
   * @override
   */
  remove() {
    this._clearController();
    this._containerGroup && this._containerGroup.removeAll();
    this._storage = createStorage();
    this._state = 'ready';
    this._breadcrumb && this._breadcrumb.remove();
  }
  dispose() {
    this._clearController();
  }
  _zoomToNode(targetInfo) {
    this.api.dispatchAction({
      type: 'treemapZoomToNode',
      from: this.uid,
      seriesId: this.seriesModel.id,
      targetNode: targetInfo.node
    });
  }
  _rootToNode(targetInfo) {
    this.api.dispatchAction({
      type: 'treemapRootToNode',
      from: this.uid,
      seriesId: this.seriesModel.id,
      targetNode: targetInfo.node
    });
  }
  /**
   * @public
   * @param {number} x Global coord x.
   * @param {number} y Global coord y.
   * @return {Object} info If not found, return undefined;
   * @return {number} info.node Target node.
   * @return {number} info.offsetX x refer to target node.
   * @return {number} info.offsetY y refer to target node.
   */
  findTarget(x, y) {
    let targetInfo;
    const viewRoot = this.seriesModel.getViewRoot();
    viewRoot.eachNode({
      attr: 'viewChildren',
      order: 'preorder'
    }, function (node) {
      const bgEl = this._storage.background[node.getRawIndex()];
      // If invisible, there might be no element.
      if (bgEl) {
        const point = bgEl.transformCoordToLocal(x, y);
        const shape = bgEl.shape;
        // For performance consideration, don't use 'getBoundingRect'.
        if (shape.x <= point[0] && point[0] <= shape.x + shape.width && shape.y <= point[1] && point[1] <= shape.y + shape.height) {
          targetInfo = {
            node: node,
            offsetX: point[0],
            offsetY: point[1]
          };
        } else {
          return false; // Suppress visit subtree.
        }
      }
    }, this);
    return targetInfo;
  }
}
TreemapView.type = 'treemap';
/**
 * @inner
 */
function createStorage() {
  return {
    nodeGroup: [],
    background: [],
    content: []
  };
}
/**
 * @inner
 * @return Return undefined means do not travel further.
 */
function renderNode(seriesModel, thisStorage, oldStorage, reRoot, lastsForAnimation, willInvisibleEls, thisNode, oldNode, parentGroup, depth) {
  // Whether under viewRoot.
  if (!thisNode) {
    // Deleting nodes will be performed finally. This method just find
    // element from old storage, or create new element, set them to new
    // storage, and set styles.
    return;
  }
  // -------------------------------------------------------------------
  // Start of closure variables available in "Procedures in renderNode".
  const thisLayout = thisNode.getLayout();
  const data = seriesModel.getData();
  const nodeModel = thisNode.getModel();
  // Only for enabling highlight/downplay. Clear firstly.
  // Because some node will not be rendered.
  data.setItemGraphicEl(thisNode.dataIndex, null);
  if (!thisLayout || !thisLayout.isInView) {
    return;
  }
  const thisWidth = thisLayout.width;
  const thisHeight = thisLayout.height;
  const borderWidth = thisLayout.borderWidth;
  const thisInvisible = thisLayout.invisible;
  const thisRawIndex = thisNode.getRawIndex();
  const oldRawIndex = oldNode && oldNode.getRawIndex();
  const thisViewChildren = thisNode.viewChildren;
  const upperHeight = thisLayout.upperHeight;
  const isParent = thisViewChildren && thisViewChildren.length;
  const itemStyleNormalModel = nodeModel.getModel('itemStyle');
  const itemStyleEmphasisModel = nodeModel.getModel(['emphasis', 'itemStyle']);
  const itemStyleBlurModel = nodeModel.getModel(['blur', 'itemStyle']);
  const itemStyleSelectModel = nodeModel.getModel(['select', 'itemStyle']);
  const borderRadius = itemStyleNormalModel.get('borderRadius') || 0;
  // End of closure ariables available in "Procedures in renderNode".
  // -----------------------------------------------------------------
  // Node group
  const group = giveGraphic('nodeGroup', Group);
  if (!group) {
    return;
  }
  parentGroup.add(group);
  // x,y are not set when el is above view root.
  group.x = thisLayout.x || 0;
  group.y = thisLayout.y || 0;
  group.markRedraw();
  inner(group).nodeWidth = thisWidth;
  inner(group).nodeHeight = thisHeight;
  if (thisLayout.isAboveViewRoot) {
    return group;
  }
  // Background
  const bg = giveGraphic('background', Rect, depth, Z2_BG);
  bg && renderBackground(group, bg, isParent && thisLayout.upperLabelHeight);
  const emphasisModel = nodeModel.getModel('emphasis');
  const focus = emphasisModel.get('focus');
  const blurScope = emphasisModel.get('blurScope');
  const isDisabled = emphasisModel.get('disabled');
  const focusOrIndices = focus === 'ancestor' ? thisNode.getAncestorsIndices() : focus === 'descendant' ? thisNode.getDescendantIndices() : focus;
  // No children, render content.
  if (isParent) {
    // Because of the implementation about "traverse" in graphic hover style, we
    // can not set hover listener on the "group" of non-leaf node. Otherwise the
    // hover event from the descendents will be listenered.
    if (isHighDownDispatcher(group)) {
      setAsHighDownDispatcher(group, false);
    }
    if (bg) {
      setAsHighDownDispatcher(bg, !isDisabled);
      // Only for enabling highlight/downplay.
      data.setItemGraphicEl(thisNode.dataIndex, bg);
      enableHoverFocus(bg, focusOrIndices, blurScope);
    }
  } else {
    const content = giveGraphic('content', Rect, depth, Z2_CONTENT);
    content && renderContent(group, content);
    bg.disableMorphing = true;
    if (bg && isHighDownDispatcher(bg)) {
      setAsHighDownDispatcher(bg, false);
    }
    setAsHighDownDispatcher(group, !isDisabled);
    // Only for enabling highlight/downplay.
    data.setItemGraphicEl(thisNode.dataIndex, group);
    enableHoverFocus(group, focusOrIndices, blurScope);
  }
  return group;
  // ----------------------------
  // | Procedures in renderNode |
  // ----------------------------
  function renderBackground(group, bg, useUpperLabel) {
    const ecData = getECData(bg);
    // For tooltip.
    ecData.dataIndex = thisNode.dataIndex;
    ecData.seriesIndex = seriesModel.seriesIndex;
    bg.setShape({
      x: 0,
      y: 0,
      width: thisWidth,
      height: thisHeight,
      r: borderRadius
    });
    if (thisInvisible) {
      // If invisible, do not set visual, otherwise the element will
      // change immediately before animation. We think it is OK to
      // remain its origin color when moving out of the view window.
      processInvisible(bg);
    } else {
      bg.invisible = false;
      const style = thisNode.getVisual('style');
      const visualBorderColor = style.stroke;
      const normalStyle = getItemStyleNormal(itemStyleNormalModel);
      normalStyle.fill = visualBorderColor;
      const emphasisStyle = getStateItemStyle(itemStyleEmphasisModel);
      emphasisStyle.fill = itemStyleEmphasisModel.get('borderColor');
      const blurStyle = getStateItemStyle(itemStyleBlurModel);
      blurStyle.fill = itemStyleBlurModel.get('borderColor');
      const selectStyle = getStateItemStyle(itemStyleSelectModel);
      selectStyle.fill = itemStyleSelectModel.get('borderColor');
      if (useUpperLabel) {
        const upperLabelWidth = thisWidth - 2 * borderWidth;
        prepareText(
        // PENDING: convert ZRColor to ColorString for text.
        bg, visualBorderColor, style.opacity, {
          x: borderWidth,
          y: 0,
          width: upperLabelWidth,
          height: upperHeight
        });
      }
      // For old bg.
      else {
        bg.removeTextContent();
      }
      bg.setStyle(normalStyle);
      bg.ensureState('emphasis').style = emphasisStyle;
      bg.ensureState('blur').style = blurStyle;
      bg.ensureState('select').style = selectStyle;
      setDefaultStateProxy(bg);
    }
    group.add(bg);
  }
  function renderContent(group, content) {
    const ecData = getECData(content);
    // For tooltip.
    ecData.dataIndex = thisNode.dataIndex;
    ecData.seriesIndex = seriesModel.seriesIndex;
    const contentWidth = Math.max(thisWidth - 2 * borderWidth, 0);
    const contentHeight = Math.max(thisHeight - 2 * borderWidth, 0);
    content.culling = true;
    content.setShape({
      x: borderWidth,
      y: borderWidth,
      width: contentWidth,
      height: contentHeight,
      r: borderRadius
    });
    if (thisInvisible) {
      // If invisible, do not set visual, otherwise the element will
      // change immediately before animation. We think it is OK to
      // remain its origin color when moving out of the view window.
      processInvisible(content);
    } else {
      content.invisible = false;
      const nodeStyle = thisNode.getVisual('style');
      const visualColor = nodeStyle.fill;
      const normalStyle = getItemStyleNormal(itemStyleNormalModel);
      normalStyle.fill = visualColor;
      normalStyle.decal = nodeStyle.decal;
      const emphasisStyle = getStateItemStyle(itemStyleEmphasisModel);
      const blurStyle = getStateItemStyle(itemStyleBlurModel);
      const selectStyle = getStateItemStyle(itemStyleSelectModel);
      // PENDING: convert ZRColor to ColorString for text.
      prepareText(content, visualColor, nodeStyle.opacity, null);
      content.setStyle(normalStyle);
      content.ensureState('emphasis').style = emphasisStyle;
      content.ensureState('blur').style = blurStyle;
      content.ensureState('select').style = selectStyle;
      setDefaultStateProxy(content);
    }
    group.add(content);
  }
  function processInvisible(element) {
    // Delay invisible setting utill animation finished,
    // avoid element vanish suddenly before animation.
    !element.invisible && willInvisibleEls.push(element);
  }
  function prepareText(rectEl, visualColor, visualOpacity,
  // Can be null/undefined
  upperLabelRect) {
    const normalLabelModel = nodeModel.getModel(upperLabelRect ? PATH_UPPERLABEL_NORMAL : PATH_LABEL_NOAMAL);
    const defaultText = convertOptionIdName(nodeModel.get('name'), null);
    const isShow = normalLabelModel.getShallow('show');
    setLabelStyle(rectEl, getLabelStatesModels(nodeModel, upperLabelRect ? PATH_UPPERLABEL_NORMAL : PATH_LABEL_NOAMAL), {
      defaultText: isShow ? defaultText : null,
      inheritColor: visualColor,
      defaultOpacity: visualOpacity,
      labelFetcher: seriesModel,
      labelDataIndex: thisNode.dataIndex
    });
    const textEl = rectEl.getTextContent();
    if (!textEl) {
      return;
    }
    const textStyle = textEl.style;
    const textPadding = normalizeCssArray(textStyle.padding || 0);
    if (upperLabelRect) {
      rectEl.setTextConfig({
        layoutRect: upperLabelRect
      });
      textEl.disableLabelLayout = true;
    }
    textEl.beforeUpdate = function () {
      const width = Math.max((upperLabelRect ? upperLabelRect.width : rectEl.shape.width) - textPadding[1] - textPadding[3], 0);
      const height = Math.max((upperLabelRect ? upperLabelRect.height : rectEl.shape.height) - textPadding[0] - textPadding[2], 0);
      if (textStyle.width !== width || textStyle.height !== height) {
        textEl.setStyle({
          width,
          height
        });
      }
    };
    textStyle.truncateMinChar = 2;
    textStyle.lineOverflow = 'truncate';
    addDrillDownIcon(textStyle, upperLabelRect, thisLayout);
    const textEmphasisState = textEl.getState('emphasis');
    addDrillDownIcon(textEmphasisState ? textEmphasisState.style : null, upperLabelRect, thisLayout);
  }
  function addDrillDownIcon(style, upperLabelRect, thisLayout) {
    const text = style ? style.text : null;
    if (!upperLabelRect && thisLayout.isLeafRoot && text != null) {
      const iconChar = seriesModel.get('drillDownIcon', true);
      style.text = iconChar ? iconChar + ' ' + text : text;
    }
  }
  function giveGraphic(storageName, Ctor, depth, z) {
    let element = oldRawIndex != null && oldStorage[storageName][oldRawIndex];
    const lasts = lastsForAnimation[storageName];
    if (element) {
      // Remove from oldStorage
      oldStorage[storageName][oldRawIndex] = null;
      prepareAnimationWhenHasOld(lasts, element);
    }
    // If invisible and no old element, do not create new element (for optimizing).
    else if (!thisInvisible) {
      element = new Ctor();
      if (element instanceof Displayable) {
        element.z2 = calculateZ2(depth, z);
      }
      prepareAnimationWhenNoOld(lasts, element);
    }
    // Set to thisStorage
    return thisStorage[storageName][thisRawIndex] = element;
  }
  function prepareAnimationWhenHasOld(lasts, element) {
    const lastCfg = lasts[thisRawIndex] = {};
    if (element instanceof Group) {
      lastCfg.oldX = element.x;
      lastCfg.oldY = element.y;
    } else {
      lastCfg.oldShape = extend({}, element.shape);
    }
  }
  // If a element is new, we need to find the animation start point carefully,
  // otherwise it will looks strange when 'zoomToNode'.
  function prepareAnimationWhenNoOld(lasts, element) {
    const lastCfg = lasts[thisRawIndex] = {};
    const parentNode = thisNode.parentNode;
    const isGroup = element instanceof graphic.Group;
    if (parentNode && (!reRoot || reRoot.direction === 'drillDown')) {
      let parentOldX = 0;
      let parentOldY = 0;
      // New nodes appear from right-bottom corner in 'zoomToNode' animation.
      // For convenience, get old bounding rect from background.
      const parentOldBg = lastsForAnimation.background[parentNode.getRawIndex()];
      if (!reRoot && parentOldBg && parentOldBg.oldShape) {
        parentOldX = parentOldBg.oldShape.width;
        parentOldY = parentOldBg.oldShape.height;
      }
      // When no parent old shape found, its parent is new too,
      // so we can just use {x:0, y:0}.
      if (isGroup) {
        lastCfg.oldX = 0;
        lastCfg.oldY = parentOldY;
      } else {
        lastCfg.oldShape = {
          x: parentOldX,
          y: parentOldY,
          width: 0,
          height: 0
        };
      }
    }
    // Fade in, user can be aware that these nodes are new.
    lastCfg.fadein = !isGroup;
  }
}
// We cannot set all background with the same z, because the behaviour of
// drill down and roll up differ background creation sequence from tree
// hierarchy sequence, which cause lower background elements to overlap
// upper ones. So we calculate z based on depth.
// Moreover, we try to shrink down z interval to [0, 1] to avoid that
// treemap with large z overlaps other components.
function calculateZ2(depth, z2InLevel) {
  return depth * Z2_BASE + z2InLevel;
}
export default TreemapView;