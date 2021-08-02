export default interface Chart {
  createCanvasElement(container: HTMLElement): any;
  subscribeBars(timeStamp: number, close: number): any;
  canvasMouseDown(e: MouseEvent | TouchEvent): any;
  canvasMouseWheel(e: MouseEvent | TouchEvent): any;
  canvasMouseMove(e: MouseEvent | TouchEvent): any;
  canvasMouseUp(e: MouseEvent | TouchEvent): any;
}
