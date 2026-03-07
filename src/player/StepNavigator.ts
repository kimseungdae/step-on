import type { MarkerData } from "../engine/types";

export class StepNavigator {
  private _markers: readonly MarkerData[] = [];

  setMarkers(markers: readonly MarkerData[]): void {
    this._markers = markers;
  }

  get count(): number {
    return this._markers.length;
  }

  getAll(): readonly MarkerData[] {
    return this._markers;
  }

  getByIndex(index: number): MarkerData | undefined {
    return this._markers[index];
  }

  getByName(name: string): MarkerData | undefined {
    return this._markers.find((m) => m.name === name);
  }

  getAtTime(time: number): MarkerData | null {
    for (const m of this._markers) {
      if (time >= m.time && time < m.time + m.duration) {
        return m;
      }
    }
    return null;
  }

  getIndexAtTime(time: number): number {
    for (let i = 0; i < this._markers.length; i++) {
      const m = this._markers[i]!;
      if (time >= m.time && time < m.time + m.duration) {
        return i;
      }
    }
    return -1;
  }

  nextTime(currentTime: number): number | null {
    for (const m of this._markers) {
      if (m.time > currentTime + 0.001) {
        return m.time;
      }
    }
    return null;
  }

  prevTime(currentTime: number): number | null {
    for (let i = this._markers.length - 1; i >= 0; i--) {
      if (this._markers[i]!.time < currentTime - 0.001) {
        return this._markers[i]!.time;
      }
    }
    return null;
  }
}
