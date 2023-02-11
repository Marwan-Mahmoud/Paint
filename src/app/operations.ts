import Konva from 'konva';

interface Operation {
  type: string;
  org?: Konva.Shape;
  clone?: Konva.Shape;
}

export class Operations {
  operations: Operation[] = [];
  undoIndex: number = 0;
  operationsCount: number = 0;

  constructor(private layer: Konva.Layer) {}

  push(type: string, org?: Konva.Shape, clone?: Konva.Shape) {
    const op: Operation = { type, org: org, clone: clone };
    this.operations[this.undoIndex++] = op;
    this.operationsCount = this.undoIndex;
  }

  undo() {
    if (this.undoIndex > 0) {
      const op = this.operations[--this.undoIndex];
      switch (op.type) {
        case 'Create':
          op.org.remove();
          break;
        case 'Delete':
          this.layer.add(op.org);
          break;
        case 'Update':
          const pos = op.clone.getPosition();
          const attrs = {
            x: pos.x,
            y: pos.y,
            scaleX: op.clone.scaleX(),
            scaleY: op.clone.scaleY(),
            rotation: op.clone.rotation()
          };
          op.clone.setAttrs(op.org.getAttrs());
          op.org.setAttrs(attrs);
      }
    }
  }

  redo() {
    if (this.undoIndex < this.operationsCount) {
      const op = this.operations[this.undoIndex++];
      switch (op.type) {
        case 'Create':
          this.layer.add(op.org);
          break;
        case 'Delete':
          op.org.remove();
          break;
        case 'Update':
          const pos = op.clone.getPosition();
          const attrs = {
            x: pos.x,
            y: pos.y,
            scaleX: op.clone.scaleX(),
            scaleY: op.clone.scaleY(),
            rotation: op.clone.rotation()
          };
          op.clone.setAttrs(op.org.getAttrs());
          op.org.setAttrs(attrs);
      }
    }
  }
}
