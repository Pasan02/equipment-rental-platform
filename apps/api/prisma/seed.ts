import { PrismaClient } from '@prisma/client';
import { UserRole, ReservationStatus, PaymentType, PaymentStatus, InventoryAction, NotificationType, UploadType, ActivityAction } from '@equipment-rental/shared-types';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean database
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.upload.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reservationItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.equipmentImage.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database data');

  // 1. Seed Users
  const saltRounds = 12;
  const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
  const staffPassword = await bcrypt.hash('Staff@123', saltRounds);
  const warehousePassword = await bcrypt.hash('Warehouse@123', saltRounds);
  const customerPassword = await bcrypt.hash('Customer@123', saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@rental.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@rental.com',
      passwordHash: staffPassword,
      firstName: 'Sarah',
      lastName: 'Stafford',
      phone: '+1234567891',
      role: UserRole.STAFF,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      email: 'warehouse@rental.com',
      passwordHash: warehousePassword,
      firstName: 'Walter',
      lastName: 'Warehouse',
      phone: '+1234567892',
      role: UserRole.WAREHOUSE,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@rental.com',
      passwordHash: customerPassword,
      firstName: 'Chris',
      lastName: 'Customer',
      phone: '+1234567893',
      role: UserRole.CUSTOMER,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Seeded 4 Users');

  // 2. Seed Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Camera Gear',
        slug: 'camera-gear',
        description: 'Professional DSLR, Mirrorless, and Cinema Cameras with Lenses',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Drones',
        slug: 'drones',
        description: 'Aerial Photography, Videography, and Cinema Drones',
        imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Audio Equipment',
        slug: 'audio-equipment',
        description: 'Microphones, Recorders, Wireless Systems, and Boom Poles',
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Lighting',
        slug: 'lighting',
        description: 'LED Panels, COB Lights, Softboxes, and RGB Tubes',
        imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Power Tools',
        slug: 'power-tools',
        description: 'Cordless Drills, Saws, Grinders, and Battery Packs',
        imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Construction Tools',
        slug: 'construction-tools',
        description: 'Generators, Compressors, Demolition Hammers, and Concrete Cutters',
        imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12',
      },
    }),
  ]);

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));
  console.log('✅ Seeded 6 Categories');

  // 3. Seed Equipment
  const equipmentData = [
    {
      name: 'Sony Alpha A7 IV Full Frame Camera',
      description: '33MP Full-Frame Exmor R CMOS Sensor, 4K 60p 10-Bit Video, 10 fps Shooting.',
      rentalPricePerDay: 75.0,
      depositAmount: 300.0,
      stockQuantity: 5,
      availableQuantity: 4,
      categoryId: categoryMap.get('camera-gear')!,
      specifications: { sensor: '33MP Full Frame', mounts: 'Sony E-mount', videoResolution: '4K 60p 10-bit 4:2:2' },
      qrCode: 'EQUIP-SONY-A7IV-001',
      images: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
        'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
      ],
    },
    {
      name: 'RED Komodo 6K Cinema Camera',
      description: 'Super35 6K Global Shutter Sensor, REDCODE RAW recording, RF Mount.',
      rentalPricePerDay: 250.0,
      depositAmount: 1000.0,
      stockQuantity: 2,
      availableQuantity: 2,
      categoryId: categoryMap.get('camera-gear')!,
      specifications: { sensor: 'Super35 6K Global Shutter', recording: 'REDCODE RAW', dynamicRange: '16+ Stops' },
      qrCode: 'EQUIP-RED-KOMODO-002',
      images: ['https://images.unsplash.com/photo-1492691527719-9d1e07e534b4'],
    },
    {
      name: 'DJI Mavic 3 Pro Cine Drone',
      description: 'Triple-Camera System, Apple ProRes Support, 43 Min Flight Time, Omnidirectional Sensing.',
      rentalPricePerDay: 120.0,
      depositAmount: 500.0,
      stockQuantity: 4,
      availableQuantity: 3,
      categoryId: categoryMap.get('drones')!,
      specifications: { maxFlightTime: '43 mins', camera: 'Hasselblad 4/3 CMOS', codec: 'Apple ProRes 422 HQ' },
      qrCode: 'EQUIP-DJI-MAVIC3P-003',
      images: ['https://images.unsplash.com/photo-1508614589041-895b88991e3e'],
    },
    {
      name: 'DJI Inspire 3 Cinema Drone',
      description: 'Full-Frame 8K CinemaDNG & ProRes RAW, Waypoint Pro, Centimeter-Level RTK Positioning.',
      rentalPricePerDay: 450.0,
      depositAmount: 2000.0,
      stockQuantity: 1,
      availableQuantity: 1,
      categoryId: categoryMap.get('drones')!,
      specifications: { camera: 'Zenmuse X9-8K Air', video: '8K 75fps ProRes RAW', positioning: 'RTK Centimeter' },
      qrCode: 'EQUIP-DJI-INSPIRE3-004',
      images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108'],
    },
    {
      name: 'Sennheiser MKH 416 Shotgun Microphone',
      description: 'Industry standard interference tube shotgun mic with superb directionality and RF immunity.',
      rentalPricePerDay: 40.0,
      depositAmount: 150.0,
      stockQuantity: 6,
      availableQuantity: 5,
      categoryId: categoryMap.get('audio-equipment')!,
      specifications: { polarPattern: 'Supercardioid/Lobar', frequencyRange: '40Hz - 20kHz', connector: '3-pin XLR' },
      qrCode: 'EQUIP-SENN-MKH416-005',
      images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc'],
    },
    {
      name: 'Røde Wireless PRO Kit',
      description: 'Dual-channel wireless microphone system with 32-bit float recording and timecode support.',
      rentalPricePerDay: 35.0,
      depositAmount: 100.0,
      stockQuantity: 8,
      availableQuantity: 7,
      categoryId: categoryMap.get('audio-equipment')!,
      specifications: { range: '260m Line of Sight', recording: '32-bit Float Internal', batteryLife: '7 Hours' },
      qrCode: 'EQUIP-RODE-WPRO-006',
      images: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc'],
    },
    {
      name: 'Aputure Light Storm 600d Pro LED',
      description: '600W Daylight COB LED light fixture, weather-resistant, Bowens mount.',
      rentalPricePerDay: 90.0,
      depositAmount: 400.0,
      stockQuantity: 3,
      availableQuantity: 3,
      categoryId: categoryMap.get('lighting')!,
      specifications: { powerConsumption: '720W Max', colorTemp: '5600K', cri: '96+' },
      qrCode: 'EQUIP-APUT-600D-007',
      images: ['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b'],
    },
    {
      name: 'Nanlite PavoTube II 30X RGB Tubes (Set of 4)',
      description: '4ft RGBWW LED Tube Light Kit with internal battery and wireless DMX control.',
      rentalPricePerDay: 80.0,
      depositAmount: 300.0,
      stockQuantity: 4,
      availableQuantity: 4,
      categoryId: categoryMap.get('lighting')!,
      specifications: { length: '4 Feet', colorRange: '2700K-12000K + RGB', CRI: '97' },
      qrCode: 'EQUIP-NAN-PAVO30X-008',
      images: ['https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b'],
    },
    {
      name: 'DeWalt 20V MAX Cordless 5-Tool Combo Kit',
      description: 'Includes Hammer Drill, Impact Driver, Circular Saw, Reciprocating Saw, and LED Work Light.',
      rentalPricePerDay: 50.0,
      depositAmount: 150.0,
      stockQuantity: 6,
      availableQuantity: 6,
      categoryId: categoryMap.get('power-tools')!,
      specifications: { voltage: '20V MAX', batteries: '2x 5.0Ah XR Batteries', charger: 'Included' },
      qrCode: 'EQUIP-DEW-20VKIT-009',
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c'],
    },
    {
      name: 'Bosch Professional SDS-Max Rotary Hammer Drill',
      description: 'Heavy duty demolition SDS-Max rotary hammer for high-impact drilling into concrete.',
      rentalPricePerDay: 65.0,
      depositAmount: 200.0,
      stockQuantity: 4,
      availableQuantity: 4,
      categoryId: categoryMap.get('power-tools')!,
      specifications: { impactEnergy: '19 Joules', motor: '15 Amp', chuckType: 'SDS-Max' },
      qrCode: 'EQUIP-BOSCH-SDS-010',
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c'],
    },
    {
      name: 'Honda EU7000is Inverter Generator',
      description: '7000W 120/240V Fuel-Injected Quiet Inverter Generator for film sets and heavy equipment.',
      rentalPricePerDay: 150.0,
      depositAmount: 600.0,
      stockQuantity: 2,
      availableQuantity: 2,
      categoryId: categoryMap.get('construction-tools')!,
      specifications: { maxOutput: '7000W', noiseLevel: '52 to 60 dBA', fuelCapacity: '5.1 Gallons' },
      qrCode: 'EQUIP-HONDA-7000W-011',
      images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12'],
    },
    {
      name: 'Stihl TS 420 Cut-Off Gasoline Saw',
      description: '14" Cut-Off Saw with X2 Air Filtration system for heavy concrete and metal cutting.',
      rentalPricePerDay: 85.0,
      depositAmount: 250.0,
      stockQuantity: 3,
      availableQuantity: 3,
      categoryId: categoryMap.get('construction-tools')!,
      specifications: { engineDisplacement: '66.7 cc', maxWheelDiameter: '14 Inches', maxCuttingDepth: '4.9 Inches' },
      qrCode: 'EQUIP-STIHL-TS420-012',
      images: ['https://images.unsplash.com/photo-1581094794329-c8112a89af12'],
    },
  ];

  const seededEquipment: any[] = [];
  for (const item of equipmentData) {
    const { images, ...equipmentFields } = item;
    const createdEquipment = await prisma.equipment.create({
      data: {
        ...equipmentFields,
        images: {
          create: images.map((url, idx) => ({
            imageUrl: url,
            sortOrder: idx,
            isPrimary: idx === 0,
          })),
        },
      },
    });
    seededEquipment.push(createdEquipment);
  }

  console.log(`✅ Seeded ${seededEquipment.length} Equipment items with images`);

  // 4. Seed Sample Reservations
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const res1 = await prisma.reservation.create({
    data: {
      reservationNumber: 'RES-20260730-001',
      customerId: customer.id,
      approvedBy: staff.id,
      status: ReservationStatus.APPROVED,
      pickupDate: today,
      returnDate: nextWeek,
      totalAmount: 525.0,
      depositTotal: 300.0,
      notes: 'Customer requested morning pickup at 9 AM.',
      items: {
        create: [
          {
            equipmentId: seededEquipment[0].id, // Sony A7IV
            quantity: 1,
            unitPrice: 75.0,
            subtotal: 525.0,
            deposit: 300.0,
          },
        ],
      },
      payments: {
        create: [
          {
            transactionId: 'TXN-RENTAL-20260730-001',
            amount: 525.0,
            type: PaymentType.RENTAL,
            status: PaymentStatus.PAID,
            paymentMethod: 'credit_card',
            paidAt: new Date(),
          },
          {
            transactionId: 'TXN-DEPOSIT-20260730-001',
            amount: 300.0,
            type: PaymentType.DEPOSIT,
            status: PaymentStatus.PAID,
            paymentMethod: 'credit_card',
            paidAt: new Date(),
          },
        ],
      },
    },
  });

  const res2 = await prisma.reservation.create({
    data: {
      reservationNumber: 'RES-20260730-002',
      customerId: customer.id,
      status: ReservationStatus.PENDING,
      pickupDate: nextWeek,
      returnDate: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      totalAmount: 360.0,
      depositTotal: 500.0,
      notes: 'Need test flight confirmation before approval.',
      items: {
        create: [
          {
            equipmentId: seededEquipment[2].id, // DJI Mavic 3 Pro
            quantity: 1,
            unitPrice: 120.0,
            subtotal: 360.0,
            deposit: 500.0,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded 2 Sample Reservations with items and payments');

  // 5. Seed Inventory Logs
  await prisma.inventoryLog.create({
    data: {
      equipmentId: seededEquipment[0].id,
      userId: warehouse.id,
      action: InventoryAction.RECEIVED,
      quantityChange: 5,
      notes: 'Initial inventory shipment received from supplier.',
    },
  });

  // 6. Seed Notification
  await prisma.notification.create({
    data: {
      userId: customer.id,
      title: 'Reservation Approved!',
      message: `Your reservation ${res1.reservationNumber} has been approved by staff.`,
      type: NotificationType.RESERVATION_APPROVED,
      isRead: false,
    },
  });

  // 7. Seed Activity Log
  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: ActivityAction.LOGIN,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  console.log('✅ Seeded Inventory Logs, Notifications, and Activity Logs');
  console.log('🚀 Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
