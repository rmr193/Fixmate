import { ObjectId } from 'mongodb';
import { hashPassword } from 'better-auth/crypto';
import { connectDB, closeDB, getCollections, getDB } from '../config/db';
import {
  BookingDocument,
  PaymentDocument,
  ServiceDocument,
  UserDocument,
} from '../types/models';

export async function seedDatabase() {
  await connectDB();
  const db = getDB();
  const { users, services, bookings, payments } = getCollections();

  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    users.deleteMany({}),
    services.deleteMany({}),
    bookings.deleteMany({}),
    payments.deleteMany({}),
    db.collection('account').deleteMany({}),
    db.collection('session').deleteMany({}),
  ]);

  const now = new Date();

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fixmate.com').toLowerCase();
  const adminPlain = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const techPlain = process.env.SEED_TECH_PASSWORD || 'Tech@123456';
  const customerPlain = process.env.SEED_CUSTOMER_PASSWORD || 'Customer@123456';

  // Hash passwords using BetterAuth's native password hasher
  const [adminHash, techHash, customerHash] = await Promise.all([
    hashPassword(adminPlain),
    hashPassword(techPlain),
    hashPassword(customerPlain),
  ]);

  const adminId = new ObjectId();
  const tech1Id = new ObjectId();
  const tech2Id = new ObjectId();
  const tech3Id = new ObjectId();
  const cust1Id = new ObjectId();
  const cust2Id = new ObjectId();

  const seedUsers: (UserDocument & { _id: ObjectId; id: string })[] = [
    {
      _id: adminId,
      id: adminId.toString(),
      name: 'System Administrator',
      email: adminEmail,
      emailVerified: true,
      image:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'admin',
      phone: '+880 1711-000100',
      area: 'Gulshan-2, Dhaka',
      bio: 'Lead Platform Operations & Quality Assurance Administrator at FixMate.',
      createdAt: new Date(now.getTime() - 30 * 86400000),
      updatedAt: now,
    },
    {
      _id: tech1Id,
      id: tech1Id.toString(),
      name: 'Arif Rahman',
      email: 'tech@fixmate.com',
      emailVerified: true,
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      role: 'technician',
      phone: '+880 1712-445566',
      area: 'Dhanmondi, Dhaka',
      bio: 'Apple & Android micro-soldering specialist with 9+ years of experience in OLED display, logic board, and laptop servicing.',
      createdAt: new Date(now.getTime() - 25 * 86400000),
      updatedAt: now,
    },
    {
      _id: tech2Id,
      id: tech2Id.toString(),
      name: 'Engr. Rafiqul Islam',
      email: 'rafiq.tech@fixmate.com',
      emailVerified: true,
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      role: 'technician',
      phone: '+880 1819-332211',
      area: 'Gulshan & Banani, Dhaka',
      bio: 'Certified HVAC & refrigeration engineer specializing in inverter split ACs, commercial chillers, and smart refrigerators.',
      createdAt: new Date(now.getTime() - 22 * 86400000),
      updatedAt: now,
    },
    {
      _id: tech3Id,
      id: tech3Id.toString(),
      name: 'Nadia Karim',
      email: 'nadia.tech@fixmate.com',
      emailVerified: true,
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      role: 'technician',
      phone: '+880 1911-778899',
      area: 'Uttara, Dhaka',
      bio: 'B.Sc. Electrical Engineer & certified home appliance diagnostics expert for 4K TVs, washing machines, and residential DB wiring.',
      createdAt: new Date(now.getTime() - 18 * 86400000),
      updatedAt: now,
    },
    {
      _id: cust1Id,
      id: cust1Id.toString(),
      name: 'Tanvir Ahmed',
      email: 'customer@fixmate.com',
      emailVerified: true,
      image:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      role: 'customer',
      phone: '+880 1677-889900',
      area: 'Mirpur-10, Dhaka',
      bio: 'Product designer and smart home enthusiast who relies on FixMate for home & studio equipment maintenance.',
      createdAt: new Date(now.getTime() - 15 * 86400000),
      updatedAt: now,
    },
    {
      _id: cust2Id,
      id: cust2Id.toString(),
      name: 'Sadia Islam',
      email: 'sadia@fixmate.com',
      emailVerified: true,
      image:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      role: 'customer',
      phone: '+880 1552-112233',
      area: 'Banani, Dhaka',
      bio: 'Homeowner looking for transparent, verified appliance servicing.',
      createdAt: new Date(now.getTime() - 12 * 86400000),
      updatedAt: now,
    },
  ];

  await users.insertMany(seedUsers);

  const accountDocs = [
    { user: seedUsers[0], hash: adminHash },
    { user: seedUsers[1], hash: techHash },
    { user: seedUsers[2], hash: techHash },
    { user: seedUsers[3], hash: techHash },
    { user: seedUsers[4], hash: customerHash },
    { user: seedUsers[5], hash: customerHash },
  ].map(({ user, hash }) => ({
    accountId: user._id.toString(),
    providerId: 'credential',
    userId: user._id.toString(),
    password: hash,
    createdAt: user.createdAt,
    updatedAt: now,
  }));

  await db.collection('account').insertMany(accountDocs);

  // 16 Services (14 Approved across all 7 categories + 2 Pending for Admin moderation queue)
  const seedServices: (ServiceDocument & { _id: ObjectId })[] = [
    {
      _id: new ObjectId(),
      title: 'iPhone & Flagship OLED Screen Replacement',
      category: 'Smartphone',
      description:
        'Precision OEM-grade OLED screen and digitizer replacement for iPhone 12–16 Pro Max and Samsung flagship devices. Includes TrueTone calibration, waterproof adhesive resealing, and a 90-day touch warranty.',
      image:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
      basePrice: 85,
      estimatedDuration: '2-3 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Arif Rahman',
      technicianEmail: 'tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 14 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Smartphone Battery & Fast-Charge Port Restoration',
      category: 'Smartphone',
      description:
        'Complete diagnostics and replacement for degraded lithium-ion batteries and damaged USB-C / Lightning charging IC ports. Tested for full PD fast-charge current stability.',
      image:
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80',
      basePrice: 40,
      estimatedDuration: '1-2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Dhanmondi & Mohammadpur, Dhaka',
      technicianName: 'Arif Rahman',
      technicianEmail: 'tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 13 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'MacBook & Ultrabook Logic Board & Thermal Overhaul',
      category: 'Laptop & PC',
      description:
        'Deep ultrasonic logic board cleaning, short-circuit capacitor replacement, Honeywell PTM7950 thermal repasting, and cooling fan bearings service to eliminate overheating and sudden shutdowns.',
      image:
        'https://images.unsplash.com/photo-1588702547919-26089e690ecc?auto=format&fit=crop&w=900&q=80',
      basePrice: 95,
      estimatedDuration: '1 day',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Arif Rahman',
      technicianEmail: 'tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 12 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Custom Workstation & Gaming PC NVMe SSD & PSU Diagnostics',
      category: 'Laptop & PC',
      description:
        'On-site desktop PC hardware troubleshooting, BIOS recovery, NVMe Gen4 SSD migration, RAM stability testing, and modular power supply voltage verification.',
      image:
        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80',
      basePrice: 55,
      estimatedDuration: '2-4 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Mirpur & Dhanmondi, Dhaka',
      technicianName: 'Arif Rahman',
      technicianEmail: 'tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 11 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Split AC Hydro-Jet Master Servicing & Anti-Bacterial Wash',
      category: 'AC',
      description:
        'Complete indoor evaporator and outdoor condenser pressure jet cleaning with protective waterproof jacket, drain pipe flushing, ampere load check, and airflow temperature optimization.',
      image:
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80',
      basePrice: 45,
      estimatedDuration: '2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Gulshan, Banani & Baridhara, Dhaka',
      technicianName: 'Engr. Rafiqul Islam',
      technicianEmail: 'rafiq.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 10 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Inverter AC R32/R410A Refrigerant Leak Fix & Gas Recharge',
      category: 'AC',
      description:
        'Nitrogen pressure leak detection, copperflare brazing, vacuum pump dehydration, and precision R32/R410A refrigerant charging by weight for 1.0 to 2.5 Ton inverter air conditioners.',
      image:
        'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80',
      basePrice: 75,
      estimatedDuration: '3-4 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Gulshan & Uttara, Dhaka',
      technicianName: 'Engr. Rafiqul Islam',
      technicianEmail: 'rafiq.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 9 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Inverter AC Outdoor PCB & Compressor Relay Repair',
      category: 'AC',
      description:
        'Component-level repair for inverter AC error codes (E1, CH05, H6, P4), IPM module replacement, capacitor renewal, and outdoor sensor calibration.',
      image:
        'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=900&q=80',
      basePrice: 65,
      estimatedDuration: '3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'All Dhaka Metro',
      technicianName: 'Engr. Rafiqul Islam',
      technicianEmail: 'rafiq.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 8 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Frost-Free Refrigerator Compressor & Cooling System Repair',
      category: 'Refrigerator',
      description:
        'Full diagnostics for non-cooling double-door and side-by-side refrigerators. Includes defrost heater, bi-metal thermostat, relay overload, and R600a compressor pressure testing.',
      image:
        'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=80',
      basePrice: 60,
      estimatedDuration: '2-3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Gulshan, Badda & Rampura, Dhaka',
      technicianName: 'Engr. Rafiqul Islam',
      technicianEmail: 'rafiq.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 7 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Refrigerator Door Gasket Seal & Digital Inverter Board Fix',
      category: 'Refrigerator',
      description:
        'Eliminate condensation and cooling loss with magnetic door gasket replacement and inverter mainboard repair for Samsung, LG, Whirlpool, and Singer refrigerators.',
      image:
        'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80',
      basePrice: 48,
      estimatedDuration: '2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Banani & Mirpur, Dhaka',
      technicianName: 'Engr. Rafiqul Islam',
      technicianEmail: 'rafiq.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 6 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: '4K Smart LED & QLED TV Backlight Array Replacement',
      category: 'TV',
      description:
        'Fixes dark screen with sound, dim patches, or flickering on 43" to 75" 4K Smart TVs. Full aluminum-backed LED strip array replacement with optical diffuser alignment.',
      image:
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80',
      basePrice: 70,
      estimatedDuration: '3-5 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Uttara Sector 7, Dhaka',
      technicianName: 'Nadia Karim',
      technicianEmail: 'nadia.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 5 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Smart TV T-Con Board, HDMI Port & Power Supply Repair',
      category: 'TV',
      description:
        'On-site repair for no-power standby light issues, vertical lines, T-Con ribbon faults, and surge-damaged HDMI ports on Sony Bravia, LG WebOS, and Samsung Smart TVs.',
      image:
        'https://images.unsplash.com/photo-1558888401-3cc1de77652d?auto=format&fit=crop&w=900&q=80',
      basePrice: 52,
      estimatedDuration: '2-3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Uttara & Bashundhara, Dhaka',
      technicianName: 'Nadia Karim',
      technicianEmail: 'nadia.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 4 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Front-Load Automatic Washing Machine Drum & Drain Pump Fix',
      category: 'Washing Machine',
      description:
        'Resolves OE/UE/LE error codes, noisy spin cycles, spider shaft bearing wear, door interlock failures, and clogged drain pump assemblies on front-load washers.',
      image:
        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80',
      basePrice: 65,
      estimatedDuration: '3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Uttara, Mirpur & Gulshan, Dhaka',
      technicianName: 'Nadia Karim',
      technicianEmail: 'nadia.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 3 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Top-Load Washing Machine Inlet Valve & PCB Controller Service',
      category: 'Washing Machine',
      description:
        'Complete repair for water overflow, non-spinning agitator clutch, pressure sensor switch, and moisture-damaged control panels with chemical descaling.',
      image:
        'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80',
      basePrice: 45,
      estimatedDuration: '2 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Uttara & Mohakhali, Dhaka',
      technicianName: 'Nadia Karim',
      technicianEmail: 'nadia.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 2 * 86400000),
    },
    {
      _id: new ObjectId(),
      title: 'Apartment DB Box, Circuit Breaker & Surge Protection Upgrade',
      category: 'Electrical',
      description:
        'Certified electrical safety overhaul: replacing tripping MCB/RCCB breakers, balancing 3-phase residential loads, thermal hotspot inspection, and whole-home surge arrestor installation.',
      image:
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
      basePrice: 50,
      estimatedDuration: '2-4 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'All Dhaka Metro',
      technicianName: 'Nadia Karim',
      technicianEmail: 'nadia.tech@fixmate.com',
      approvalStatus: 'approved',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 1 * 86400000),
    },
    // 2 Pending services for Admin Moderation queue testing
    {
      _id: new ObjectId(),
      title: 'Smart IPS / Solar Inverter Automatic Changeover Wiring',
      category: 'Electrical',
      description:
        'Professional pure-sine-wave IPS installation, tubular battery terminal maintenance, and zero-delay automatic changeover breaker wiring for home offices.',
      image:
        'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=900&q=80',
      basePrice: 58,
      estimatedDuration: '3 hours',
      serviceMode: 'Home Visit',
      serviceArea: 'Uttara & Banani, Dhaka',
      technicianName: 'Nadia Karim',
      technicianEmail: 'nadia.tech@fixmate.com',
      approvalStatus: 'pending',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 12 * 3600000),
    },
    {
      _id: new ObjectId(),
      title: 'iPad Pro Liquid Retina Display & USB-C Controller Repair',
      category: 'Smartphone',
      description:
        'Micro-precision glass lamination and Apple Pencil Pro digitizer calibration for iPad Pro 11" and 12.9" models.',
      image:
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80',
      basePrice: 110,
      estimatedDuration: '4 hours',
      serviceMode: 'Shop Drop-off',
      serviceArea: 'Dhanmondi, Dhaka',
      technicianName: 'Arif Rahman',
      technicianEmail: 'tech@fixmate.com',
      approvalStatus: 'pending',
      isAvailable: true,
      createdAt: new Date(now.getTime() - 6 * 3600000),
    },
  ];

  await services.insertMany(seedServices);

  // Create 8 realistic bookings across all statuses:
  // 1. completed + paid (Arif - iPhone OLED Screen)
  // 2. completed + paid (Rafiq - Split AC Hydro-Jet)
  // 3. completed + paid (Nadia - Front-Load Washing Machine)
  // 4. completed + unpaid (Arif - MacBook Thermal Overhaul -> READY FOR "PAY NOW" DEMO!)
  // 5. in-progress (Rafiq - Frost-Free Refrigerator)
  // 6. accepted (Nadia - 4K Smart TV Backlight)
  // 7. requested (Arif - Smartphone Battery -> READY FOR CANCEL OR ACCEPT/REJECT DEMO!)
  // 8. rejected (Rafiq - Inverter AC Gas Recharge)
  const b1Id = new ObjectId();
  const b2Id = new ObjectId();
  const b3Id = new ObjectId();
  const b4Id = new ObjectId();
  const b5Id = new ObjectId();
  const b6Id = new ObjectId();
  const b7Id = new ObjectId();
  const b8Id = new ObjectId();

  const seedBookings: (BookingDocument & { _id: ObjectId })[] = [
    {
      _id: b1Id,
      serviceId: seedServices[0]._id.toString(),
      serviceTitle: seedServices[0].title,
      serviceImage: seedServices[0].image,
      category: seedServices[0].category,
      basePrice: seedServices[0].basePrice,
      technicianName: seedServices[0].technicianName,
      technicianEmail: seedServices[0].technicianEmail,
      customerName: 'Tanvir Ahmed',
      customerEmail: 'customer@fixmate.com',
      customerPhone: '+880 1677-889900',
      address: 'House 14, Road 7, Block C, Mirpur-10, Dhaka',
      preferredDate: new Date(now.getTime() - 8 * 86400000),
      problemDescription:
        'Dropped my iPhone 15 Pro on tile flooring. Bottom-right corner glass is cracked and green vertical OLED line appears intermittently.',
      status: 'completed',
      finalAmount: 95,
      paymentStatus: 'paid',
      rating: 5,
      review:
        'Arif replaced the OLED panel cleanly in 2 hours with full TrueTone working. Looks factory fresh!',
      reviewedAt: new Date(now.getTime() - 7 * 86400000),
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 9 * 86400000),
          note: 'Repair request submitted by customer.',
        },
        {
          status: 'accepted',
          changedAt: new Date(now.getTime() - 8.5 * 86400000),
          note: 'Accepted by Arif Rahman.',
        },
        {
          status: 'in-progress',
          changedAt: new Date(now.getTime() - 8.2 * 86400000),
          note: 'OLED panel replacement in progress.',
        },
        {
          status: 'completed',
          changedAt: new Date(now.getTime() - 8 * 86400000),
          note: 'Job marked completed with final amount $95.',
        },
        {
          status: 'paid',
          changedAt: new Date(now.getTime() - 7.8 * 86400000),
          note: 'Paid $95.00 via Stripe (pi_3FixMateSeed0001).',
        },
      ],
      createdAt: new Date(now.getTime() - 9 * 86400000),
    },
    {
      _id: b2Id,
      serviceId: seedServices[4]._id.toString(),
      serviceTitle: seedServices[4].title,
      serviceImage: seedServices[4].image,
      category: seedServices[4].category,
      basePrice: seedServices[4].basePrice,
      technicianName: seedServices[4].technicianName,
      technicianEmail: seedServices[4].technicianEmail,
      customerName: 'Tanvir Ahmed',
      customerEmail: 'customer@fixmate.com',
      customerPhone: '+880 1677-889900',
      address: 'House 14, Road 7, Block C, Mirpur-10, Dhaka',
      preferredDate: new Date(now.getTime() - 5 * 86400000),
      problemDescription:
        '1.5 Ton Daikin Split AC in master bedroom has weak airflow and water dripping from the indoor unit tray.',
      status: 'completed',
      finalAmount: 50,
      paymentStatus: 'paid',
      rating: 5,
      review:
        'Engr. Rafiqul did a thorough hydro-jet wash without making any mess. Cooling is ice cold now!',
      reviewedAt: new Date(now.getTime() - 4 * 86400000),
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 6 * 86400000),
        },
        {
          status: 'accepted',
          changedAt: new Date(now.getTime() - 5.5 * 86400000),
        },
        {
          status: 'in-progress',
          changedAt: new Date(now.getTime() - 5.2 * 86400000),
        },
        {
          status: 'completed',
          changedAt: new Date(now.getTime() - 5 * 86400000),
        },
        {
          status: 'paid',
          changedAt: new Date(now.getTime() - 4.9 * 86400000),
        },
      ],
      createdAt: new Date(now.getTime() - 6 * 86400000),
    },
    {
      _id: b3Id,
      serviceId: seedServices[11]._id.toString(),
      serviceTitle: seedServices[11].title,
      serviceImage: seedServices[11].image,
      category: seedServices[11].category,
      basePrice: seedServices[11].basePrice,
      technicianName: seedServices[11].technicianName,
      technicianEmail: seedServices[11].technicianEmail,
      customerName: 'Sadia Islam',
      customerEmail: 'sadia@fixmate.com',
      customerPhone: '+880 1552-112233',
      address: 'Apt 5B, Road 11, Block F, Banani, Dhaka',
      preferredDate: new Date(now.getTime() - 3 * 86400000),
      problemDescription:
        'LG 8kg Front-Load washing machine stops mid-cycle showing OE error code and fails to drain water.',
      status: 'completed',
      finalAmount: 72,
      paymentStatus: 'paid',
      rating: 5,
      review:
        'Nadia diagnosed the burned drain pump motor in 15 minutes and installed an original LG replacement.',
      reviewedAt: new Date(now.getTime() - 2 * 86400000),
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 4 * 86400000),
        },
        {
          status: 'accepted',
          changedAt: new Date(now.getTime() - 3.6 * 86400000),
        },
        {
          status: 'in-progress',
          changedAt: new Date(now.getTime() - 3.3 * 86400000),
        },
        {
          status: 'completed',
          changedAt: new Date(now.getTime() - 3 * 86400000),
        },
        {
          status: 'paid',
          changedAt: new Date(now.getTime() - 2.8 * 86400000),
        },
      ],
      createdAt: new Date(now.getTime() - 4 * 86400000),
    },
    // Completed + Unpaid booking for immediate "Pay Now" testing by customer@fixmate.com
    {
      _id: b4Id,
      serviceId: seedServices[2]._id.toString(),
      serviceTitle: seedServices[2].title,
      serviceImage: seedServices[2].image,
      category: seedServices[2].category,
      basePrice: seedServices[2].basePrice,
      technicianName: seedServices[2].technicianName,
      technicianEmail: seedServices[2].technicianEmail,
      customerName: 'Tanvir Ahmed',
      customerEmail: 'customer@fixmate.com',
      customerPhone: '+880 1677-889900',
      address: 'House 14, Road 7, Block C, Mirpur-10, Dhaka',
      preferredDate: new Date(now.getTime() - 1 * 86400000),
      problemDescription:
        'MacBook Pro 16-inch thermal throttles under load and right cooling fan makes a rattling noise above 4000 RPM.',
      status: 'completed',
      finalAmount: 105,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 2 * 86400000),
          note: 'Repair request submitted by customer.',
        },
        {
          status: 'accepted',
          changedAt: new Date(now.getTime() - 1.5 * 86400000),
          note: 'Accepted by Arif Rahman.',
        },
        {
          status: 'in-progress',
          changedAt: new Date(now.getTime() - 1.2 * 86400000),
          note: 'Thermal repasting & right fan module replacement underway.',
        },
        {
          status: 'completed',
          changedAt: new Date(now.getTime() - 0.5 * 86400000),
          note: 'Job marked completed with final amount $105.',
        },
      ],
      createdAt: new Date(now.getTime() - 2 * 86400000),
    },
    // In-Progress booking
    {
      _id: b5Id,
      serviceId: seedServices[7]._id.toString(),
      serviceTitle: seedServices[7].title,
      serviceImage: seedServices[7].image,
      category: seedServices[7].category,
      basePrice: seedServices[7].basePrice,
      technicianName: seedServices[7].technicianName,
      technicianEmail: seedServices[7].technicianEmail,
      customerName: 'Tanvir Ahmed',
      customerEmail: 'customer@fixmate.com',
      customerPhone: '+880 1677-889900',
      address: 'House 14, Road 7, Block C, Mirpur-10, Dhaka',
      preferredDate: new Date(now.getTime() + 1 * 86400000),
      problemDescription:
        'Samsung 550L Refrigerator freezer works fine but lower fresh-food compartment is warm at 14°C.',
      status: 'in-progress',
      finalAmount: 60,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 1.5 * 86400000),
        },
        {
          status: 'accepted',
          changedAt: new Date(now.getTime() - 1 * 86400000),
        },
        {
          status: 'in-progress',
          changedAt: new Date(now.getTime() - 0.3 * 86400000),
        },
      ],
      createdAt: new Date(now.getTime() - 1.5 * 86400000),
    },
    // Accepted booking (Assigned to tech@fixmate.com so technician can click "Start Work")
    {
      _id: b6Id,
      serviceId: seedServices[3]._id.toString(),
      serviceTitle: seedServices[3].title,
      serviceImage: seedServices[3].image,
      category: seedServices[3].category,
      basePrice: seedServices[3].basePrice,
      technicianName: seedServices[3].technicianName,
      technicianEmail: seedServices[3].technicianEmail,
      customerName: 'Sadia Islam',
      customerEmail: 'sadia@fixmate.com',
      customerPhone: '+880 1552-112233',
      address: 'Apt 5B, Road 11, Block F, Banani, Dhaka',
      preferredDate: new Date(now.getTime() + 2 * 86400000),
      problemDescription:
        'Workstation desktop fails POST with DRAM status LED lit orange after power outage.',
      status: 'accepted',
      finalAmount: 55,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 1 * 86400000),
        },
        {
          status: 'accepted',
          changedAt: new Date(now.getTime() - 0.4 * 86400000),
        },
      ],
      createdAt: new Date(now.getTime() - 1 * 86400000),
    },
    // Requested booking (Customer can test Cancel, or Technician tech@fixmate.com can test Accept/Reject)
    {
      _id: b7Id,
      serviceId: seedServices[1]._id.toString(),
      serviceTitle: seedServices[1].title,
      serviceImage: seedServices[1].image,
      category: seedServices[1].category,
      basePrice: seedServices[1].basePrice,
      technicianName: seedServices[1].technicianName,
      technicianEmail: seedServices[1].technicianEmail,
      customerName: 'Tanvir Ahmed',
      customerEmail: 'customer@fixmate.com',
      customerPhone: '+880 1677-889900',
      address: 'House 14, Road 7, Block C, Mirpur-10, Dhaka',
      preferredDate: new Date(now.getTime() + 3 * 86400000),
      problemDescription:
        'Galaxy S23 Ultra battery drains from 80% to 15% in under 3 hours and USB-C cable disconnects loosely.',
      status: 'requested',
      finalAmount: 40,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 4 * 3600000),
        },
      ],
      createdAt: new Date(now.getTime() - 4 * 3600000),
    },
    // Cancelled booking
    {
      _id: b8Id,
      serviceId: seedServices[13]._id.toString(),
      serviceTitle: seedServices[13].title,
      serviceImage: seedServices[13].image,
      category: seedServices[13].category,
      basePrice: seedServices[13].basePrice,
      technicianName: seedServices[13].technicianName,
      technicianEmail: seedServices[13].technicianEmail,
      customerName: 'Sadia Islam',
      customerEmail: 'sadia@fixmate.com',
      customerPhone: '+880 1552-112233',
      address: 'Apt 5B, Road 11, Block F, Banani, Dhaka',
      preferredDate: new Date(now.getTime() - 2 * 86400000),
      problemDescription:
        'Kitchen RCB breaker trips whenever microwave and electric kettle run simultaneously on the same line.',
      status: 'cancelled',
      finalAmount: 50,
      paymentStatus: 'unpaid',
      statusHistory: [
        {
          status: 'requested',
          changedAt: new Date(now.getTime() - 3 * 86400000),
        },
        {
          status: 'cancelled',
          changedAt: new Date(now.getTime() - 2.5 * 86400000),
          note: 'Cancelled by customer due to travel schedule.',
        },
      ],
      createdAt: new Date(now.getTime() - 3 * 86400000),
    },
  ];

  await bookings.insertMany(seedBookings);

  // 3 Verified Payments for the 3 paid bookings
  const seedPayments: PaymentDocument[] = [
    {
      bookingId: b1Id.toString(),
      serviceTitle: seedBookings[0].serviceTitle,
      customerName: seedBookings[0].customerName,
      customerEmail: seedBookings[0].customerEmail,
      technicianName: seedBookings[0].technicianName,
      technicianEmail: seedBookings[0].technicianEmail,
      amount: 95,
      currency: 'usd',
      transactionId: 'pi_3FixMateSeed0001OLED',
      stripeSessionId: 'cs_test_a1FixMateSeedSession0001OLED',
      paymentStatus: 'paid',
      paidAt: new Date(now.getTime() - 7.8 * 86400000),
    },
    {
      bookingId: b2Id.toString(),
      serviceTitle: seedBookings[1].serviceTitle,
      customerName: seedBookings[1].customerName,
      customerEmail: seedBookings[1].customerEmail,
      technicianName: seedBookings[1].technicianName,
      technicianEmail: seedBookings[1].technicianEmail,
      amount: 50,
      currency: 'usd',
      transactionId: 'pi_3FixMateSeed0002HVAC',
      stripeSessionId: 'cs_test_a1FixMateSeedSession0002HVAC',
      paymentStatus: 'paid',
      paidAt: new Date(now.getTime() - 4.9 * 86400000),
    },
    {
      bookingId: b3Id.toString(),
      serviceTitle: seedBookings[2].serviceTitle,
      customerName: seedBookings[2].customerName,
      customerEmail: seedBookings[2].customerEmail,
      technicianName: seedBookings[2].technicianName,
      technicianEmail: seedBookings[2].technicianEmail,
      amount: 72,
      currency: 'usd',
      transactionId: 'pi_3FixMateSeed0003WASH',
      stripeSessionId: 'cs_test_a1FixMateSeedSession0003WASH',
      paymentStatus: 'paid',
      paidAt: new Date(now.getTime() - 2.8 * 86400000),
    },
  ];

  await payments.insertMany(seedPayments);

  console.log('[Seed] Successfully seeded FixMate database:');
  console.log(`  - Users: ${seedUsers.length} (1 Admin, 3 Technicians, 2 Customers)`);
  console.log(`  - Services: ${seedServices.length} (14 Approved, 2 Pending across 7 categories)`);
  console.log(`  - Bookings: ${seedBookings.length} (Across all workflow statuses)`);
  console.log(`  - Payments: ${seedPayments.length} ($217.00 verified revenue)`);
}

if (require.main === module) {
  seedDatabase()
    .then(() => closeDB())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}
