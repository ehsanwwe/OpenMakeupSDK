export class KalmanFilter2D {
    constructor(r = 0.005, q = 0.002) {
        this.r = r; // measurement noise
        this.q = q; // process noise
        this.px = 1;
        this.py = 1;
        this.x = 0;
        this.y = 0;
    }

    update(measureX, measureY) {
        const kx = this.px / (this.px + this.r);
        const ky = this.py / (this.py + this.r);

        this.x += kx * (measureX - this.x);
        this.y += ky * (measureY - this.y);

        this.px = (1 - kx) * this.px + this.q;
        this.py = (1 - ky) * this.py + this.q;

        return { x: this.x, y: this.y };
    }
}
