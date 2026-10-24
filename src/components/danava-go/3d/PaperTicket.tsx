import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TICKET_CONFIG } from './ticketConfig';
import type { TimelineProgress } from './journeyTimeline';

interface PaperTicketProps {
  flapAngle?: number; // Góc mở nắp flap tính bằng radians (0: mở phẳng, Math.PI: đóng gập)
  isDebug?: boolean;
  fromCity?: string;
  toCity?: string;
  timelineRef?: React.RefObject<TimelineProgress | null>;
}

/**
 * Sinh Texture in vé hành trình thanh nhã trên mặt cuống vé giấy
 * Tuyệt đối không DAD/HUI: Hiển thị ĐÀ NẴNG → HUẾ rõ ràng, trang nhã.
 */
function createTicketPrintTexture(fromCity: string = 'Đà Nẵng', toCity: string = 'Huế'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Nền giấy ivory cao cấp
  ctx.fillStyle = '#FFFDF8';
  ctx.fillRect(0, 0, 512, 768);

  // Viền bo ngoài
  ctx.strokeStyle = '#D8D4C9';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, 472, 728);

  // Viền chỉ đứt đoạn hành trình
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = '#0097A7';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 448, 704);
  ctx.setLineDash([]);

  // Dải header thương hiệu
  ctx.fillStyle = '#102744';
  ctx.fillRect(40, 48, 432, 68);

  ctx.font = 'bold 22px "Noto Serif", serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText('DANAVA GO', 256, 80);

  ctx.font = '600 11px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#E0F7FA';
  ctx.fillText('VÉ HÀNH TRÌNH ĐIỆN TỬ • BOARDING PASS', 256, 102);

  // Tiêu đề tuyến đường lớn: ĐÀ NẴNG → HUẾ
  ctx.font = 'bold 34px "Noto Serif", serif';
  ctx.fillStyle = '#102744';
  ctx.fillText(`${fromCity.toUpperCase()} → ${toCity.toUpperCase()}`, 256, 178);

  // Dòng phụ đề di sản
  ctx.font = 'bold 13px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#0097A7';
  ctx.fillText('CẦU RỒNG SÔNG HÀN • NGỌ MÔN HOÀNG THÀNH', 256, 210);

  // Nét phân cách mờ
  ctx.strokeStyle = '#E2DCD0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(50, 235);
  ctx.lineTo(462, 235);
  ctx.stroke();

  // Bảng thông số hành trình
  ctx.textAlign = 'left';
  ctx.fillStyle = '#718096';
  ctx.font = '500 12px "Be Vietnam Pro", sans-serif';
  ctx.fillText('NGÀY KHỞI HÀNH', 60, 268);
  ctx.fillText('GIỜ XUẤT PHÁT', 300, 268);

  ctx.fillStyle = '#102744';
  ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
  ctx.fillText('24/10/2026', 60, 296);
  ctx.fillText('08:30 SÁNG', 300, 296);

  ctx.fillStyle = '#718096';
  ctx.font = '500 12px "Be Vietnam Pro", sans-serif';
  ctx.fillText('HẠNG PHƯƠNG TIỆN', 60, 345);
  ctx.fillText('VỊ TRÍ CHỖ NGỒI', 300, 345);

  ctx.fillStyle = '#102744';
  ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
  ctx.fillText('GIƯỜNG NẰM VIP', 60, 373);
  ctx.fillText('TẦNG 1 • 06B', 300, 373);

  // Nét phân cách 2
  ctx.beginPath();
  ctx.moveTo(50, 405);
  ctx.lineTo(462, 405);
  ctx.stroke();

  // Thông số quãng đường & đèo Hải Vân
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0097A7';
  ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
  ctx.fillText('CỰ LY: 100 KM • TUYẾN QUA ĐÈO HẢI VÂN', 256, 440);

  // Mã vạch tượng trưng phía dưới
  ctx.fillStyle = '#102744';
  const barStarts = [70, 85, 105, 120, 130, 150, 165, 185, 200, 220, 240, 260, 275, 295, 315, 335, 355, 370, 390, 410, 430];
  barStarts.forEach((bx, i) => {
    const bw = (i % 3 === 0) ? 5 : (i % 2 === 0 ? 3 : 2);
    ctx.fillRect(bx, 510, bw, 60);
  });

  ctx.font = '11px monospace';
  ctx.fillStyle = '#718096';
  ctx.fillText('DANAVA-GO • DAD-HUE • 2026-VIP-0830', 256, 595);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Tạo Shape 2D cho tấm giấy có bo góc nhẹ và khuyết notch bán nguyệt
 */
function createTicketPanelShape(
  width: number,
  depth: number,
  cornerR: number,
  notchOptions?: {
    hasLeftNotch?: boolean;
    hasRightNotch?: boolean;
    hasTopNotch?: boolean;
    hasBottomNotch?: boolean;
    notchRadius?: number;
  }
): THREE.Shape {
  const shape = new THREE.Shape();
  const halfW = width / 2;
  const halfD = depth / 2;
  const nr = notchOptions?.notchRadius || 0.09;

  // Bắt đầu từ góc trên bên trái
  shape.moveTo(-halfW + cornerR, halfD);

  // Cạnh trên (Top edge)
  if (notchOptions?.hasTopNotch) {
    shape.lineTo(-nr, halfD);
    shape.absarc(0, halfD, nr, Math.PI, 0, true); // Khuyết bán nguyệt vào trong
    shape.lineTo(halfW - cornerR, halfD);
  } else {
    shape.lineTo(halfW - cornerR, halfD);
  }

  // Góc trên bên phải
  shape.quadraticCurveTo(halfW, halfD, halfW, halfD - cornerR);

  // Cạnh phải (Right edge)
  if (notchOptions?.hasRightNotch) {
    shape.lineTo(halfW, nr);
    shape.absarc(halfW, 0, nr, Math.PI / 2, -Math.PI / 2, true); // Khuyết bán nguyệt vào trong
    shape.lineTo(halfW, -halfD + cornerR);
  } else {
    shape.lineTo(halfW, -halfD + cornerR);
  }

  // Góc dưới bên phải
  shape.quadraticCurveTo(halfW, -halfD, halfW - cornerR, -halfD);

  // Cạnh dưới (Bottom edge)
  if (notchOptions?.hasBottomNotch) {
    shape.lineTo(nr, -halfD);
    shape.absarc(0, -halfD, nr, 0, Math.PI, true); // Khuyết bán nguyệt vào trong
    shape.lineTo(-halfW + cornerR, -halfD);
  } else {
    shape.lineTo(-halfW + cornerR, -halfD);
  }

  // Góc dưới bên trái
  shape.quadraticCurveTo(-halfW, -halfD, -halfW, -halfD + cornerR);

  // Cạnh trái (Left edge)
  if (notchOptions?.hasLeftNotch) {
    shape.lineTo(-halfW, -nr);
    shape.absarc(-halfW, 0, nr, -Math.PI / 2, Math.PI / 2, true); // Khuyết bán nguyệt vào trong
    shape.lineTo(-halfW, halfD - cornerR);
  } else {
    shape.lineTo(-halfW, halfD - cornerR);
  }

  // Góc trên bên trái khép vòng
  shape.quadraticCurveTo(-halfW, halfD, -halfW + cornerR, halfD);

  return shape;
}

export const PaperTicket: React.FC<PaperTicketProps> = ({
  flapAngle = 0.0,
  isDebug = false,
  fromCity = 'Đà Nẵng',
  toCity = 'Huế',
  timelineRef,
}) => {
  const { dimensions, panels, material } = TICKET_CONFIG;
  const flapPivotRef = useRef<THREE.Group>(null);

  // Cập nhật góc mở bản lề trực tiếp trên mesh (zero React re-renders)
  useFrame(() => {
    if (flapPivotRef.current) {
      if (timelineRef?.current) {
        flapPivotRef.current.rotation.z = -timelineRef.current.flapAngle;
      } else {
        flapPivotRef.current.rotation.z = -flapAngle;
      }
    }
  });

  const ticketPrintTexture = useMemo(
    () => createTicketPrintTexture(fromCity, toCity),
    [fromCity, toCity]
  );

  // 1. Hình học Base Deck (Sàn vé chính bên phải, chứa sa bàn diorama & đường cong)
  const baseDeckGeometry = useMemo(() => {
    const shape = createTicketPanelShape(
      panels.baseDeck.width,
      panels.baseDeck.depth,
      0.08,
      {
        hasRightNotch: true,
        notchRadius: panels.notches.radius,
      }
    );

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: dimensions.paperThickness,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.002,
      bevelThickness: 0.002,
    });

    // Xoay hình học để nằm ngang trên mặt phẳng X-Z (Extrude mặc định đùn theo trục Z)
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [panels, dimensions]);

  // 2. Hình học Folding Flap (Cánh vé gập / cuống vé bên trái có bản lề cơ học)
  const flapGeometry = useMemo(() => {
    const shape = createTicketPanelShape(
      panels.foldingFlap.width,
      panels.foldingFlap.depth,
      0.08,
      {
        hasLeftNotch: true,
        notchRadius: panels.notches.radius,
      }
    );

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: dimensions.paperThickness,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.002,
      bevelThickness: 0.002,
    });

    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, [panels, dimensions]);

  return (
    <group name="DANAVA_PAPER_TICKET">
      {/* =======================================================================
          A. BASE DECK (Mặt sàn vé chính bên phải)
          Tọa độ X mở rộng từ hingeX (-1.4) sang phải (+3.8)
          ======================================================================= */}
      <mesh
        geometry={baseDeckGeometry}
        position={panels.baseDeck.centerOffset}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={material.faceColor}
          roughness={material.roughness}
          metalness={material.metalness}
        />
      </mesh>

      {/* =======================================================================
          B. HINGE PIVOT GROUP & FOLDING FLAP (Cánh vé gập có bản lề cơ học)
          Pivot đặt chính xác tại đường bản lề [hingeX, paperThickness, 0]
          Xoay quanh trục Z:
            0 rad: Mở phẳng hoàn toàn (unfolded static state)
            Math.PI rad: Đóng gập lên mặt sàn chính
          ======================================================================= */}
      <group
        ref={flapPivotRef}
        name="TICKET_HINGE_PIVOT_GROUP"
        position={[panels.hingeX, dimensions.paperThickness, 0]}
        rotation={[0, 0, -flapAngle]}
      >
        <mesh
          geometry={flapGeometry}
          position={panels.foldingFlap.localCenter}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color={material.faceColor}
            roughness={material.roughness}
            metalness={material.metalness}
          />
        </mesh>

        {/* Mặt in thông tin vé hành trình chính thức: ĐÀ NẴNG → HUẾ (không DAD/HUI) */}
        <mesh
          position={[panels.foldingFlap.localCenter[0], 0.0006, 0]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        >
          <planeGeometry args={[panels.baseDeck.depth - 0.45, panels.foldingFlap.width - 0.35]} />
          <meshBasicMaterial
            map={ticketPrintTexture}
            transparent
            opacity={0.94}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* =======================================================================
          C. CREASE LINE (Nếp gấp dập chìm giả lập nếp ép thớ giấy)
          Chạy dọc đúng trục bản lề X = -1.4
          ======================================================================= */}
      <mesh
        position={[panels.hingeX, dimensions.paperThickness + 0.0005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.024, panels.baseDeck.depth - 0.08]} />
        <meshBasicMaterial
          color={material.creaseColor}
          depthWrite={false}
        />
      </mesh>

      {/* =======================================================================
          D. DEBUG HINGE AXIS (Chỉ hiển thị khi bật chế độ dev ?debug=1)
          ======================================================================= */}
      {isDebug && (
        <group position={[panels.hingeX, dimensions.paperThickness + 0.02, 0]}>
          {/* Trục bản lề Z-axis hiển thị bằng ống cylinder mảnh nổi bật */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 4.0, 8]} />
            <meshBasicMaterial color="#FF007F" />
          </mesh>
        </group>
      )}
    </group>
  );
};
