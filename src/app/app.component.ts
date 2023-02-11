import { Component, AfterViewInit } from '@angular/core';
import Konva from 'konva';
import exportFromJSON from 'export-from-json';
import { Operations } from './operations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit {
  stage: Konva.Stage;
  layer: Konva.Layer;
  transformer: Konva.Transformer;
  color: string = '#000000';
  lineWidth: string = '2';
  isDrawing: boolean = false;
  isDraging: boolean = false;
  x1: number;
  y1: number;
  action: string = '';
  buttons: boolean[] = [];
  isFill: boolean = false;
  isSelect: boolean = false;
  shape: Konva.Shape;
  operations: Operations;

  ngAfterViewInit(): void {
    this.stage = new Konva.Stage({
      container: 'container',
      width: window.innerWidth * 0.97,
      height: window.innerHeight * 0.77,
    });
    this.initStage();
    this.layer = new Konva.Layer();
    this.transformer = new Konva.Transformer();
    this.layer.add(this.transformer);
    this.stage.add(this.layer);
    this.operations = new Operations(this.layer);
  }

  private initStage() {
    this.stage.on('mousedown', this.start.bind(this));
    this.stage.on('mouseup', this.end.bind(this));
    this.stage.on('mousemove', this.drag.bind(this));
    this.stage.on('click tap', this.select.bind(this));
  }

  start(e: Konva.KonvaPointerEvent) {
    if (this.action) {
      const position = this.stage.getPointerPosition();
      this.x1 = position.x;
      this.y1 = position.y;

      if (this.action == 'text') {
        this.text(e.evt.clientX, e.evt.clientY);
      } else {
        if (this.action == 'pen') this.pen(this.x1, this.y1);
        this.isDrawing = true;
      }
    }
  }

  drag() {
    if (this.isDrawing) {
      const position = this.stage.getPointerPosition();
      const x2 = position.x;
      const y2 = position.y;
      switch (this.action) {
        case 'line':
          this.drawLine(this.x1, this.y1, x2, y2);
          break;
        case 'rectangle':
          this.drawRectange(this.x1, this.y1, x2 - this.x1, y2 - this.y1);
          break;
        case 'square':
          this.drawSquare(this.x1, this.y1, x2 - this.x1, y2 - this.y1);
          break;
        case 'circle':
          this.drawCircle(this.x1, this.y1, this.distance(this.x1, this.y1, x2, y2));
          break;
        case 'ellipse':
          this.drawEllipse(this.midpoint(this.x1, x2), this.midpoint(this.y1, y2), Math.floor(Math.abs(x2 - this.x1) / 2.0), Math.floor(Math.abs(y2 - this.y1) / 2.0));
          break;
        case 'triangle':
          this.drawTriangle(this.x1, this.y1, x2, y2, this.x1 - (x2 - this.x1), y2);
          break;
        case 'pen':
          this.pen(x2, y2);
      }
    }
  }

  end() {
    this.isDrawing = false;
    if (this.isDraging) {
      this.isDraging = false;
      this.operations.push('Create', this.shape);
      this.addListeners();
    }
  }

  private addListeners() {
    this.shape.on('dragstart', () => this.shape = <Konva.Shape>this.transformer.getNodes()[0].clone());
    this.shape.on('dragend', () => this.operations.push('Update', <Konva.Shape>this.transformer.getNodes()[0], this.shape));
    this.shape.on('transformstart', () => this.shape = <Konva.Shape>this.transformer.getNodes()[0].clone());
    this.shape.on('transformend', () => this.operations.push('Update', <Konva.Shape>this.transformer.getNodes()[0], this.shape));
  }

  select(e: Konva.KonvaPointerEvent) {
    if (this.isSelect) {
      this.unselect();
      if (e.target != this.stage) {
        this.transformer.setNodes([e.target]);
        e.target.setDraggable(true);
      }
    }
  }

  private unselect() {
    this.transformer.setNodes([]);
    for (const child of this.layer.getChildren()) {
      if (child.getClassName() != 'Transformer') child.setDraggable(false);
    }
  }

  fillSwitch() {
    this.isFill = !this.isFill;
  }

  selectSwitch() {
    this.isSelect = !this.isSelect;
    if (this.isSelect) {
      for (let i = 0; i < 8; i++) {
        this.buttons[i] = false;
      }
      this.action = '';
    } else {
      this.unselect();
    }
  }

  clicked(value: string) {
    for (let i = 0; i < 8; i++) {
      this.buttons[i] = false;
    }
    enum buttons { 'line', 'circle', 'ellipse', 'triangle', 'rectangle', 'square', 'pen', 'text' }
    this.buttons[buttons[value]] = true;
    this.action = value;

    if (this.isSelect) this.selectSwitch();
  }

  drawLine(x1: number, y1: number, x2: number, y2: number) {
    if (this.isDraging) {
      this.shape.setAttr('points', [x1, y1, x2, y2]);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Line({
        points: [x1, y1, x2, y2],
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });

      this.layer.add(this.shape);
    }
  }

  drawSquare(x: number, y: number, w: number, h: number) {
    if (Math.abs(w) > Math.abs(h)) {
      w = h * Math.sign(h) * Math.sign(w);
    } else {
      h = w * Math.sign(w) * Math.sign(h);
    }
    this.drawRectange(x, y, w, h);
  }

  drawRectange(x: number, y: number, w: number, h: number) {
    if (this.isDraging) {
      this.shape.setAttr('width', w);
      this.shape.setAttr('height', h);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Rect({
        x: x,
        y: y,
        width: w,
        height: h,
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });
      if (this.isFill) this.shape.setAttr('fill', this.color);

      this.layer.add(this.shape);
    }
  }

  drawCircle(x: number, y: number, radius: number) {
    if (this.isDraging) {
      this.shape.setAttr('radius', radius);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Circle({
        x: x,
        y: y,
        radius: radius,
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });
      if (this.isFill) this.shape.setAttr('fill', this.color);

      this.layer.add(this.shape);
    }
  }

  drawEllipse(x: number, y: number, radiusX: number, radiusY: number) {
    if (this.isDraging) {
      this.shape.setAttr('radiusX', radiusX);
      this.shape.setAttr('radiusY', radiusY);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Ellipse({
        x: x,
        y: y,
        radiusX: radiusX,
        radiusY: radiusY,
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth)
      });
      if (this.isFill) this.shape.setAttr('fill', this.color);

      this.layer.add(this.shape);
    }
  }

  drawTriangle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    if (this.isDraging) {
      this.shape.setAttr('points', [x1, y1, x2, y2, x3, y3]);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Line({
        points: [x1, y1, x2, y2, x3, y3],
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth),
        closed: true
      });
      if (this.isFill) this.shape.setAttr('fill', this.color);

      this.layer.add(this.shape);
    }
  }

  pen(x: number, y: number) {
    if (this.isDraging) {
      const points = this.shape.getAttr('points');
      points.push(x, y);
      this.shape.setAttr('points', points);
    } else {
      this.isDraging = true;
      this.shape = new Konva.Line({
        points: [x, y, x, y],
        stroke: this.color,
        strokeWidth: parseInt(this.lineWidth),
        lineCap: 'round'
      });

      this.layer.add(this.shape);
    }
  }

  text(x: number, y: number) {
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.style.left = x + 'px';
    textarea.style.top = y + 'px';
    textarea.style.width = 200 + 'px';
    textarea.style.position = 'absolute';
    window.setTimeout(() => textarea.focus(), 0);

    textarea.onblur = () => this.replaceTextarea(textarea);
    textarea.onkeydown = (e) => { if (e.key == 'Enter' && !e.shiftKey) this.replaceTextarea(textarea); };
    this.selectSwitch();
  }

  private replaceTextarea(textarea: HTMLTextAreaElement) {
    this.shape = new Konva.Text({
      text: textarea.value,
      x: this.x1,
      y: this.y1,
      fontSize: 24,
      fill: this.color
    });
    document.body.removeChild(textarea);
    this.layer.add(this.shape);
    this.operations.push('Create', this.shape);
    this.addListeners();
  }

  delete() {
    const nodes = this.transformer.getNodes();
    if (nodes.length != 0) {
      this.shape = <Konva.Shape>nodes[0];
      this.operations.push('Delete', this.shape);
      this.shape.remove();
      this.unselect();
    }
  }

  copy() {
    const nodes = this.transformer.getNodes();
    if (nodes.length != 0) {
      const pos = nodes[0].getPosition();
      this.shape = nodes[0].clone({ x: pos.x + 50, y: pos.y + 50 });
      this.layer.add(this.shape);
      this.operations.push('Create', this.shape);
    }
  }

  undo() {
    if (this.isSelect) this.selectSwitch();
    this.operations.undo();
  }

  redo() {
    if (this.isSelect) this.selectSwitch();
    this.operations.redo();
  }

  save() {
    exportFromJSON({ data: JSON.parse(this.stage.toJSON()), fileName: 'paint', exportType: 'json' });
  }

  load(e: any) {
    const reader: FileReader = new FileReader();
    reader.onload = () => {
      const json = reader.result;
      this.stage.destroy();
      this.stage = Konva.Node.create(json, 'container');
      this.initStage();
      this.layer = this.stage.getChildren()[0];
      this.transformer = this.layer.findOne('Transformer');
      this.operations = new Operations(this.layer);
    };
    reader.readAsText(e.target.files[0]);
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  private midpoint(a: number, b: number): number {
    return Math.floor((a + b) / 2.0);
  }
}
