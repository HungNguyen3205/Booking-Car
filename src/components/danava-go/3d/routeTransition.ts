/**
 * DANAVA GO — Route & Scene Transition Controller (BƯỚC 12)
 * 
 * ============================================================================
 * QUY CHUẨN ĐỒNG BỘ FORM, SCENE VÀ ROUTE (60FPS ZERO REACT RE-RENDERS):
 * ============================================================================
 * 1. Form cập nhật lựa chọn ngay (0ms).
 * 2. Lựa chọn cuối thắng (Latest Choice Wins) qua Version/Request ID.
 * 3. Chuyển cảnh 3D diễn ra êm mượt trong useFrame, không block React rendering.
 * 4. Cụm cũ hạ/mờ -> Cập nhật data -> Cụm mới trồi lên từ mặt vé.
 * 5. Nhãn và Route SVG đồng bộ trực tiếp trên DOM, không có frame tên mới đè công trình cũ.
 * 6. Đảo chiều (Swap): Hoán đổi nguyên tử 2 slot, đổi hướng route, giữ nguyên ngày/khách/xe.
 * 7. Asset lỗi: Giữ cảnh trước an toàn, có toast thông báo nhẹ.
 * ============================================================================
 */

import { useMemo, useCallback, useEffect } from 'react';
import {
  resolveDestination,
  resolveRoute,
  type DestinationDefinition,
  type JourneyRouteDefinition,
} from './destinationConfig';

export interface RouteData {
  fromCity: string;
  toCity: string;
  fromDest: DestinationDefinition;
  toDest: DestinationDefinition;
  routeDef: JourneyRouteDefinition;
}

export function createRouteData(from: string, to: string): RouteData {
  return {
    fromCity: from,
    toCity: to,
    fromDest: resolveDestination(from, 'origin'),
    toDest: resolveDestination(to, 'destination'),
    routeDef: resolveRoute(from, to),
  };
}

export class RouteTransitionController {
  public current: RouteData;
  public pending: RouteData | null = null;
  public progress: number = 1.0; // 1.0 = hiển thị đầy đủ, 0.0 = đã hạ/mờ hoàn toàn
  public phase: 'idle' | 'exiting' | 'entering' = 'idle';
  public requestId: number = 0;
  public shouldReduceMotion: boolean = false;
  public isVehicleFading: boolean = false;

  private exitSpeed: number = 1 / 0.18; // ~180ms hạ xuống
  private enterSpeed: number = 1 / 0.22; // ~220ms trồi lên

  constructor(initialFrom: string, initialTo: string, shouldReduceMotion: boolean = false) {
    this.current = createRouteData(initialFrom, initialTo);
    this.shouldReduceMotion = shouldReduceMotion;
  }

  /**
   * Đặt tuyến mục tiêu mới (Latest Choice Wins)
   */
  public requestRoute(nextFrom: string, nextTo: string): number {
    this.requestId++;
    const reqId = this.requestId;

    // Nếu tuyến trùng khớp với hiện tại và không có pending -> không làm gì
    if (
      this.current.fromCity === nextFrom &&
      this.current.toCity === nextTo &&
      !this.pending
    ) {
      return reqId;
    }

    // Nếu chọn tuyến ngược lại hoặc tuyến mới:
    const targetData = createRouteData(nextFrom, nextTo);

    if (this.shouldReduceMotion) {
      // Đổi trực tiếp không qua animation hạ trồi
      this.current = targetData;
      this.pending = null;
      this.progress = 1.0;
      this.phase = 'idle';
      this.isVehicleFading = false;
      return reqId;
    }

    this.pending = targetData;
    this.phase = 'exiting';
    // Đánh dấu fade xe nếu chuyển đổi địa hình khác biệt
    this.isVehicleFading = targetData.routeDef.transitionType !== this.current.routeDef.transitionType;
    return reqId;
  }

  /**
   * Cập nhật tiến trình từng frame trong useFrame (chạy ở tần số 60fps)
   * Đảm bảo tiến trình LUÔN hồi tụ về 1.0, không bao giờ bị kẹt
   */
  public update(delta: number): void {
    const dt = Math.min(delta, 0.04);

    if (this.phase === 'exiting') {
      this.progress -= dt * this.exitSpeed;
      if (this.progress <= 0.0) {
        this.progress = 0.0;
        // Chuyển data sang tuyến mới nhất khi cụm cũ đã hạ hẳn
        if (this.pending) {
          this.current = this.pending;
          this.pending = null;
        }
        this.phase = 'entering';
      }
    } else if (this.phase === 'entering') {
      this.progress += dt * this.enterSpeed;
      if (this.progress >= 1.0) {
        this.progress = 1.0;
        this.phase = 'idle';
        this.isVehicleFading = false;
      }
    } else {
      // Trạng thái idle: Luôn giữ 1.0
      this.progress = 1.0;
    }
  }
}

/**
 * React Hook khởi tạo và quản lý RouteTransitionController
 */
export function useRouteTransitionController(
  initialFrom: string,
  initialTo: string,
  shouldReduceMotion: boolean = false
) {
  const controller = useMemo(
    () => new RouteTransitionController(initialFrom, initialTo, shouldReduceMotion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    controller.shouldReduceMotion = shouldReduceMotion;
  }, [controller, shouldReduceMotion]);

  const requestRoute = useCallback(
    (from: string, to: string) => {
      return controller.requestRoute(from, to);
    },
    [controller]
  );

  return {
    controller,
    requestRoute,
  };
}
