class LevelProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._acc = [];
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input && input[0]) {
      const ch = input[0];
      // Accumulate samples to compute stable metrics
      for (let i = 0; i < ch.length; i++) this._acc.push(ch[i]);

      if (this._acc.length >= 1024) {
        const size = 1024;
        const buf = this._acc.slice(0, size);
        this._acc = this._acc.slice(size);

        // RMS and min/max
        let sumSq = 0;
        let min = 1;
        let max = -1;
        for (let i = 0; i < buf.length; i++) {
          const s = buf[i];
          if (s < min) min = s;
          if (s > max) max = s;
          sumSq += s * s;
        }
        const rms = Math.sqrt(sumSq / buf.length);

        // Downsample to ~256 points for UI
        const outLen = 256;
        const stride = Math.max(1, Math.floor(buf.length / outLen));
        const down = new Float32Array(outLen);
        for (let i = 0; i < outLen; i++) {
          const idx = Math.min(buf.length - 1, i * stride);
          down[i] = buf[idx];
        }

        this.port.postMessage({ rms, down, min, max }, [down.buffer]);
      }
    }

    // Ensure silent pass-through (keep graph active)
    if (output && output[0]) {
      output[0].fill(0);
    }

    return true;
  }
}

registerProcessor("level-processor", LevelProcessor);
