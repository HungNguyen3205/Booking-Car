import React, { useMemo } from 'react';
import * as THREE from 'three';
import { TICKET_CONFIG } from './ticketConfig';

interface PaperTicketProps {
  flapAngle?: number; // Góc mở nắp flap tính bằng radians (0: mở phẳng, Math.PI: đóng gập)
  isDebug?: boolean;
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
}) => {
  const { dimensions, panels, material } = TICKET_CONFIG;

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
        name="TICKET_HINGE_PIVOT_GROUP"
        position={[panels.hingeX, dimensions.paperThickness, 0]}
        rotation={[0, 0, flapAngle]}
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
