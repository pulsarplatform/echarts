
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
import SymbolDraw from '../helper/SymbolDraw.js';
import LineDraw from '../helper/LineDraw.js';
import RoamController from '../../component/helper/RoamController.js';
import * as roamHelper from '../../component/helper/roamHelper.js';
import { onIrrelevantElement } from '../../component/helper/cursorHelper.js';
import * as graphic from '../../util/graphic.js';
import adjustEdge from './adjustEdge.js';
import { getNodeGlobalScale } from './graphHelper.js';
import ChartView from '../../view/Chart.js';
import { getECData } from '../../util/innerStore.js';
import { simpleLayoutEdge } from './simpleLayoutHelper.js';
import { circularLayout, rotateNodeLabel } from './circularLayoutHelper.js';
function isViewCoordSys(coordSys) {
  return coordSys.type === 'view';
}
class GraphView extends ChartView {
  constructor() {
    super(...arguments);
    this.type = GraphView.type;
  }
  init(ecModel, api) {
    const symbolDraw = new SymbolDraw();
    const lineDraw = new LineDraw();
    const group = this.group;
    this._controller = new RoamController(api.getZr());
    this._controllerHost = {
      target: group
    };
    group.add(symbolDraw.group);
    group.add(lineDraw.group);
    this._symbolDraw = symbolDraw;
    this._lineDraw = lineDraw;
    this._firstRender = true;
  }
  render(seriesModel, ecModel, api) {
    const coordSys = seriesModel.coordinateSystem;
    this._model = seriesModel;
    const symbolDraw = this._symbolDraw;
    const lineDraw = this._lineDraw;
    const group = this.group;
    if (isViewCoordSys(coordSys)) {
      const groupNewProp = {
        x: coordSys.x,
        y: coordSys.y,
        scaleX: coordSys.scaleX,
        scaleY: coordSys.scaleY
      };
      if (this._firstRender) {
        group.attr(groupNewProp);
      } else {
        graphic.updateProps(group, groupNewProp, seriesModel);
      }
    }
    // Fix edge contact point with node
    adjustEdge(seriesModel.getGraph(), getNodeGlobalScale(seriesModel));
    const data = seriesModel.getData();
    symbolDraw.updateData(data);
    const edgeData = seriesModel.getEdgeData();
    // TODO: TYPE
    lineDraw.updateData(edgeData);
    this._updateNodeAndLinkScale();
    this._updateController(seriesModel, ecModel, api);
    clearTimeout(this._layoutTimeout);
    const forceLayout = seriesModel.forceLayout;
    const layoutAnimation = seriesModel.get(['force', 'layoutAnimation']);
    if (forceLayout) {
      this._startForceLayoutIteration(forceLayout, layoutAnimation);
    }
    const layout = seriesModel.get('layout');
    data.graph.eachNode(node => {
      const idx = node.dataIndex;
      const el = node.getGraphicEl();
      const itemModel = node.getModel();
      if (!el) {
        return;
      }
      // Update draggable
      el.off('drag').off('dragend');
      const draggable = itemModel.get('draggable');
      if (draggable) {
        el.on('drag', e => {
          switch (layout) {
            case 'force':
              forceLayout.warmUp();
              !this._layouting && this._startForceLayoutIteration(forceLayout, layoutAnimation);
              forceLayout.setFixed(idx);
              // Write position back to layout
              data.setItemLayout(idx, [el.x, el.y]);
              break;
            case 'circular':
              data.setItemLayout(idx, [el.x, el.y]);
              // mark node fixed
              node.setLayout({
                fixed: true
              }, true);
              // recalculate circular layout
              circularLayout(seriesModel, 'symbolSize', node, [e.offsetX, e.offsetY]);
              this.updateLayout(seriesModel);
              break;
            case 'none':
            default:
              data.setItemLayout(idx, [el.x, el.y]);
              // update edge
              simpleLayoutEdge(seriesModel.getGraph(), seriesModel);
              this.updateLayout(seriesModel);
              break;
          }
        }).on('dragend', () => {
          if (forceLayout) {
            forceLayout.setUnfixed(idx);
          }
        });
      }
      el.setDraggable(draggable, !!itemModel.get('cursor'));
      const focus = itemModel.get(['emphasis', 'focus']);
      if (focus === 'adjacency') {
        getECData(el).focus = node.getAdjacentDataIndices();
      }
    });
    data.graph.eachEdge(function (edge) {
      const el = edge.getGraphicEl();
      const focus = edge.getModel().get(['emphasis', 'focus']);
      if (!el) {
        return;
      }
      if (focus === 'adjacency') {
        getECData(el).focus = {
          edge: [edge.dataIndex],
          node: [edge.node1.dataIndex, edge.node2.dataIndex]
        };
      }
    });
    const circularRotateLabel = seriesModel.get('layout') === 'circular' && seriesModel.get(['circular', 'rotateLabel']);
    const cx = data.getLayout('cx');
    const cy = data.getLayout('cy');
    data.graph.eachNode(node => {
      rotateNodeLabel(node, circularRotateLabel, cx, cy);
    });
    this._firstRender = false;
  }
  dispose() {
    this.remove();
    this._controller && this._controller.dispose();
    this._controllerHost = null;
  }
  _startForceLayoutIteration(forceLayout, layoutAnimation) {
    const self = this;
    (function step() {
      forceLayout.step(function (stopped) {
        self.updateLayout(self._model);
        (self._layouting = !stopped) && (layoutAnimation ? self._layoutTimeout = setTimeout(step, 16) : step());
      });
    })();
  }
  _updateController(seriesModel, ecModel, api) {
    const controller = this._controller;
    const controllerHost = this._controllerHost;
    const group = this.group;
    controller.setPointerChecker(function (e, x, y) {
      const rect = group.getBoundingRect();
      rect.applyTransform(group.transform);
      return rect.contain(x, y) && !onIrrelevantElement(e, api, seriesModel);
    });
    if (!isViewCoordSys(seriesModel.coordinateSystem)) {
      controller.disable();
      return;
    }
    controller.enable(seriesModel.get('roam'));
    controllerHost.zoomLimit = seriesModel.get('scaleLimit');
    controllerHost.zoom = seriesModel.coordinateSystem.getZoom();
    controller.off('pan').off('zoom').on('pan', e => {
      roamHelper.updateViewOnPan(controllerHost, e.dx, e.dy);
      api.dispatchAction({
        seriesId: seriesModel.id,
        type: 'graphRoam',
        dx: e.dx,
        dy: e.dy
      });
    }).on('zoom', e => {
      roamHelper.updateViewOnZoom(controllerHost, e.scale, e.originX, e.originY);
      api.dispatchAction({
        seriesId: seriesModel.id,
        type: 'graphRoam',
        zoom: e.scale,
        originX: e.originX,
        originY: e.originY
      });
      this._updateNodeAndLinkScale();
      adjustEdge(seriesModel.getGraph(), getNodeGlobalScale(seriesModel));
      this._lineDraw.updateLayout();
      // Only update label layout on zoom
      api.updateLabelLayout();
    });
  }
  _updateNodeAndLinkScale() {
    const seriesModel = this._model;
    const data = seriesModel.getData();
    const nodeScale = getNodeGlobalScale(seriesModel);
    data.eachItemGraphicEl(function (el, idx) {
      el && el.setSymbolScale(nodeScale);
    });
  }
  updateLayout(seriesModel) {
    adjustEdge(seriesModel.getGraph(), getNodeGlobalScale(seriesModel));
    this._symbolDraw.updateLayout();
    this._lineDraw.updateLayout();
  }
  remove() {
    clearTimeout(this._layoutTimeout);
    this._layouting = false;
    this._layoutTimeout = null;
    this._symbolDraw && this._symbolDraw.remove();
    this._lineDraw && this._lineDraw.remove();
  }
}
GraphView.type = 'graph';
export default GraphView;