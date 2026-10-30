import { existsSync } from "node:fs";
import bcrypt from "bcryptjs";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "./db.js";

if (existsSync(".env")) process.loadEnvFile(".env");

/**
 * Idempotent seed: riders are upserted by email and orders by code.
 * Re-running resets every seeded order to the state below, which is handy after testing the flow.
 */

const PASSWORD = "rider123";

const riders = [
  { email: "maya@rider.test", name: "Maya Patel", vehicle: "Scooter · MH12 AB 4521" },
  { email: "ravi@rider.test", name: "Ravi Kulkarni", vehicle: "Bicycle" },
] as const;

type SeedOrder = {
  code: string;
  rider: (typeof riders)[number]["email"];
  status: OrderStatus;
  restaurantName: string;
  restaurantAddress: string;
  customerFirstName: string;
  address: string;
  dropoffNote?: string;
  payoutCents: number;
  items: { name: string; quantity: number }[];
  /** Minutes ago the order was assigned; later stamps follow from it. */
  ageMinutes: number;
};

const orders: SeedOrder[] = [
  // Maya: three waiting to be accepted, no active order, two delivered.
  {
    code: "RD-1001",
    rider: "maya@rider.test",
    status: "ASSIGNED",
    restaurantName: "Tandoor Junction",
    restaurantAddress: "14 FC Road, Shivajinagar",
    customerFirstName: "Aarav",
    address: "Flat 402, Sunrise Towers, Baner Road",
    dropoffNote: "Ring twice, the bell is quiet",
    payoutCents: 6500,
    items: [
      { name: "Butter chicken", quantity: 1 },
      { name: "Garlic naan", quantity: 3 },
      { name: "Mango lassi", quantity: 2 },
    ],
    ageMinutes: 6,
  },
  {
    code: "RD-1002",
    rider: "maya@rider.test",
    status: "ASSIGNED",
    restaurantName: "Green Bowl Salads",
    restaurantAddress: "Lane 7, Koregaon Park",
    customerFirstName: "Sara",
    address: "22 Riverside Villas, Kalyani Nagar",
    payoutCents: 4800,
    items: [
      { name: "Quinoa power bowl", quantity: 2 },
      { name: "Cold-pressed juice", quantity: 1 },
    ],
    ageMinutes: 4,
  },
  {
    code: "RD-1003",
    rider: "maya@rider.test",
    status: "ASSIGNED",
    restaurantName: "Slice Republic",
    restaurantAddress: "Phoenix Mall, Viman Nagar",
    customerFirstName: "Kabir",
    address: "B-12 Tech Park Hostel, Kharadi",
    dropoffNote: "Leave with the security desk",
    payoutCents: 5500,
    items: [
      { name: "Margherita pizza (large)", quantity: 1 },
      { name: "Garlic breadsticks", quantity: 1 },
    ],
    ageMinutes: 2,
  },
  {
    code: "RD-0991",
    rider: "maya@rider.test",
    status: "DELIVERED",
    restaurantName: "Wok Express",
    restaurantAddress: "MG Road, Camp",
    customerFirstName: "Neha",
    address: "9 Hill View Society, Aundh",
    payoutCents: 7200,
    items: [
      { name: "Hakka noodles", quantity: 2 },
      { name: "Chilli paneer", quantity: 1 },
    ],
    ageMinutes: 180,
  },
  {
    code: "RD-0987",
    rider: "maya@rider.test",
    status: "DELIVERED",
    restaurantName: "Chai & Co.",
    restaurantAddress: "Model Colony",
    customerFirstName: "Rohan",
    address: "Office 5, Pride Icon, Kharadi",
    payoutCents: 3500,
    items: [
      { name: "Masala chai", quantity: 4 },
      { name: "Bun maska", quantity: 4 },
    ],
    ageMinutes: 300,
  },
  // Ravi: one picked up (active), one waiting, one delivered.
  {
    code: "RD-1004",
    rider: "ravi@rider.test",
    status: "PICKED_UP",
    restaurantName: "Burger Barn",
    restaurantAddress: "SB Road, Model Colony",
    customerFirstName: "Isha",
    address: "House 31, Lane 4, Prabhat Road",
    dropoffNote: "Gate code 4512",
    payoutCents: 5900,
    items: [
      { name: "Double smash burger", quantity: 2 },
      { name: "Peri-peri fries", quantity: 1 },
    ],
    ageMinutes: 25,
  },
  {
    code: "RD-1005",
    rider: "ravi@rider.test",
    status: "ASSIGNED",
    restaurantName: "Dosa Corner",
    restaurantAddress: "Deccan Gymkhana",
    customerFirstName: "Meera",
    address: "17 Erandwane Housing Society",
    payoutCents: 4200,
    items: [
      { name: "Masala dosa", quantity: 2 },
      { name: "Filter coffee", quantity: 2 },
    ],
    ageMinutes: 3,
  },
  {
    code: "RD-0990",
    rider: "ravi@rider.test",
    status: "DELIVERED",
    restaurantName: "Sweet Tooth Bakery",
    restaurantAddress: "Kothrud Depot",
    customerFirstName: "Tanvi",
    address: "5 Paud Road, Kothrud",
    payoutCents: 3900,
    items: [{ name: "Chocolate truffle cake (1 kg)", quantity: 1 }],
    ageMinutes: 240,
  },
];

function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000);
}

function stamps(status: OrderStatus, ageMinutes: number) {
  const assignedAt = minutesAgo(ageMinutes);
  const reached = (s: OrderStatus) =>
    ["ASSIGNED", "ACCEPTED", "PICKED_UP", "DELIVERED"].indexOf(status) >=
    ["ASSIGNED", "ACCEPTED", "PICKED_UP", "DELIVERED"].indexOf(s);
  return {
    assignedAt,
    acceptedAt: reached("ACCEPTED") ? minutesAgo(ageMinutes - 2) : null,
    pickedUpAt: reached("PICKED_UP") ? minutesAgo(ageMinutes - 12) : null,
    deliveredAt: reached("DELIVERED") ? minutesAgo(ageMinutes - 30) : null,
  };
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const riderIds = new Map<string, string>();

  for (const r of riders) {
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name, vehicle: r.vehicle, role: "RIDER", passwordHash },
      create: { email: r.email, name: r.name, vehicle: r.vehicle, role: "RIDER", passwordHash },
    });
    riderIds.set(r.email, user.id);
  }

  for (const o of orders) {
    const data = {
      restaurantName: o.restaurantName,
      restaurantAddress: o.restaurantAddress,
      customerFirstName: o.customerFirstName,
      address: o.address,
      dropoffNote: o.dropoffNote ?? null,
      payoutCents: o.payoutCents,
      status: o.status,
      riderId: riderIds.get(o.rider)!,
      ...stamps(o.status, o.ageMinutes),
    };
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.upsert({
        where: { code: o.code },
        update: data,
        create: { code: o.code, ...data },
      });
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({ data: o.items.map((i) => ({ ...i, orderId: order.id })) });
    });
  }

  console.log(`Seeded ${riders.length} riders and ${orders.length} orders.`);
  for (const r of riders) console.log(`  ${r.email} / ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
