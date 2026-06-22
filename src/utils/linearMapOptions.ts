/**
 * 线性映射配置项
 */
export interface LinearMapOptions {
  /** 源区间最小值 */
  inMin: number;
  /** 源区间最大值 */
  inMax: number;
  /** 目标区间最小值 */
  outMin: number;
  /** 目标区间最大值 */
  outMax: number;
  /** 是否开启边界钳制（防止超出范围） */
  clamp?: boolean;
  /** 步长限制（例如 0.1 或 10），默认为无限制 */
  step?: number;
}

/**
 * 双向线性映射工具类
 * 适用于滑块(Slider)、进度条(Progress)、摇杆等复杂交互组件
 */
export class BidirectionalMap {
  private readonly inMin: number;
  private readonly inMax: number;
  private readonly outMin: number;
  private readonly outMax: number;
  private readonly clamp: boolean;
  private readonly step: number;

  // 预计算斜率和截距，提升高频交互时的性能
  private readonly slope: number;
  private readonly intercept: number;

  constructor(options: LinearMapOptions) {
    const { inMin, inMax, outMin, outMax, clamp = true, step = 0 } = options;

    if (inMin === inMax) {
      throw new Error(`BidirectionalMap Error: inMin (${inMin}) cannot equal inMax (${inMax})`);
    }

    this.inMin = inMin;
    this.inMax = inMax;
    this.outMin = outMin;
    this.outMax = outMax;
    this.clamp = clamp;
    this.step = step;

    // 预计算线性方程参数: y = slope * x + intercept
    this.slope = (outMax - outMin) / (inMax - inMin);
    this.intercept = outMin - inMin * this.slope;
  }

  /**
   * 内部处理：钳制边界 + 步长对齐
   */
  private process(value: number, min: number, max: number): number {
    let result = value;

    // 1. 边界钳制
    if (this.clamp) {
      const trueMin = Math.min(min, max);
      const trueMax = Math.max(min, max);
      result = Math.min(Math.max(result, trueMin), trueMax);
    }

    // 2. 步长对齐（四舍五入到最近的 step）
    if (this.step > 0) {
      result = Math.round(result / this.step) * this.step;
      // 步长对齐后可能再次越界，需要再次钳制
      if (this.clamp) {
        const trueMin = Math.min(min, max);
        const trueMax = Math.max(min, max);
        result = Math.min(Math.max(result, trueMin), trueMax);
      }
    }

    return result;
  }

  /**
   * 正向映射：源区间 -> 目标区间
   * 例如：将 鼠标X坐标(10~100) 映射为 实际音量(100~500)
   */
  public map(value: number): number {
    const mapped = value * this.slope + this.intercept;
    return this.process(mapped, this.outMin, this.outMax);
  }

  /**
   * 反向映射：目标区间 -> 源区间
   * 例如：将 实际音量(300) 映射回 鼠标X坐标
   */
  public unmap(value: number): number {
    const unmapped = (value - this.intercept) / this.slope;
    return this.process(unmapped, this.inMin, this.inMax);
  }

  /**
   * 获取当前值在源区间中的百分比 (0 ~ 1)
   * 常用于计算 UI 滑块的宽度或位置
   */
  public getPercent(value: number): number {
    if (this.inMax === this.inMin) return 0;
    const percent = (value - this.inMin) / (this.inMax - this.inMin);
    return this.clamp ? Math.min(Math.max(percent, 0), 1) : percent;
  }

  /**
   * 根据百分比 (0 ~ 1) 获取源区间的值
   * 常用于根据 UI 拖拽比例计算实际值
   */
  public getValueByPercent(percent: number): number {
    const clampedPercent = Math.min(Math.max(percent, 0), 1);
    const value = this.inMin + clampedPercent * (this.inMax - this.inMin);
    return this.process(value, this.inMin, this.inMax);
  }
}