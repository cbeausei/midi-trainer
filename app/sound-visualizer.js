class SoundVisualizer {
  constructor(canvas, soundPlayer) {
    this.canvas_ = canvas;
    this.context_ = canvas.getContext('2d');
    this.soundPlayer_ = soundPlayer;
    this.stopped_ = false;
  }

  startTimeVisualization() {
    this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
    this.context_.fillStyle = '#333333';
    this.context_.strokeStyle = '#ffffff';
    this.context_.lineWidth = 1;
    this.drawTimeViz();
  }

  startFreqVisualization() {
    this.context_.clearRect(0, 0, this.canvas_.width, this.canvas_.height);
    this.context_.strokeStyle = '#ffffff';
    this.context_.lineWidth = 1;
    this.drawFreqViz();
  }

  stop() {
    this.stopped_ = true;
  }

  drawTimeViz() {
    if (!this.stopped_) {
      requestAnimationFrame(() => this.drawTimeViz());
    }

    this.context_.fillRect(0, 0, this.canvas_.width, this.canvas_.height);
    const data = this.soundPlayer_.getByteTimeDomainData();
    this.context_.beginPath();
    const sliceWidth = this.canvas_.width * 1.0 / data.length;
    let x = 0;
    for (let i = 0; i < data.length; ++i) {
      const v = data[i] / 128.0;
      const y = v * this.canvas_.height / 2;
      if (i === 0) {
        this.context_.moveTo(x, y);
      } else {
        this.context_.lineTo(x, y);
      }
      x += sliceWidth;
    }
    this.context_.stroke();
  }

  drawFreqViz() {
    if (!this.stopped_) {
      requestAnimationFrame(() => this.drawFreqViz());
    }

    this.context_.fillStyle = '#333333';
    this.context_.fillRect(0, 0, this.canvas_.width, this.canvas_.height);
    const fdata = this.soundPlayer_.getByteFrequencyData();
    const barWidth = this.canvas_.width / fdata.length * 10;
    let x = 0;
    for (let i = 0; i < fdata.length; ++i) {
      const barHeight = fdata[i] / 2;
      this.context_.fillStyle = `rgb(${100 + barHeight}, 50, 50)`;
      this.context_.fillRect(x, this.canvas_.height - barHeight / 2, barWidth, barHeight);
      x += barWidth;
    }
  }
}
