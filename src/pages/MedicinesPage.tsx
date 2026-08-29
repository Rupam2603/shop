import { useState, useMemo, useEffect } from "react";
import ProductDetailModal, { CAT_COLORS, HSN_BY_CAT, retailerPrice, PopupProduct } from "../components/ProductModal";
import KeyCategoriesBar, { KeyCategoryItem } from "../components/KeyCategoriesBar";
import InsuranceModal from "../components/InsuranceModal";
import { fetchProducts, DbProduct, subscribeToProductsRealtime } from "../lib/products";
import { useCart } from "../contexts/CartContext";

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&q=80`;

/* ─── Full product catalog from Categorized_Items_List ─── */
const ALL_PRODUCTS = [

  // ── Pain Relief & Balms ──
  { id: 1,  name: "Volini Gel 15g",                  sub: "Pain Relief Gel",            price: "₹11",   orig: "₹15",   disc: "27%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1691096675075-de995918f3ce") },
  { id: 2,  name: "Amrutanjan Strong Balm 44g",      sub: "Fast Relief Balm",           price: "₹36",   orig: "₹44",   disc: "18%", cat: "Pain Relief & Balms",            brand: "Amrutanjan",  img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 3,  name: "Volini Spray 249ml",              sub: "Pain Relief Spray",          price: "₹177",  orig: "₹249",  disc: "29%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 4,  name: "Volini Spray 340ml",              sub: "Pain Relief Spray",          price: "₹241",  orig: "₹340",  disc: "29%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 5,  name: "Volini Gel 54g",                  sub: "Diclofenac Gel",             price: "₹38",   orig: "₹54",   disc: "29%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1691096675075-de995918f3ce") },
  { id: 6,  name: "Moov Chain 15g",                  sub: "Pain Relief Chain",          price: "₹13",   orig: "₹15",   disc: "13%", cat: "Pain Relief & Balms",            brand: "Moov",        img: U("photo-1616750819574-7e38aa8046fa") },
  { id: 7,  name: "Volini Gel 65g",                  sub: "Diclofenac Gel",             price: "₹45",   orig: "₹65",   disc: "31%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1691096675075-de995918f3ce") },
  { id: 8,  name: "Volini Gel 156g",                 sub: "Diclofenac Gel",             price: "₹111",  orig: "₹156",  disc: "29%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1691096675075-de995918f3ce") },
  { id: 9,  name: "Volini Spray 187ml",              sub: "Pain Relief Spray",          price: "₹133",  orig: "₹187",  disc: "29%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 10, name: "Volini Spray 88ml",               sub: "Pain Relief Spray",          price: "₹63",   orig: "₹88",   disc: "28%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 11, name: "Volini Pain Relief Gel 50g",      sub: "Diclofenac Gel",             price: "₹130",  orig: "₹180",  disc: "28%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1691096675075-de995918f3ce") },
  { id: 12, name: "Volini Chain 15g",                sub: "Pain Relief Chain",          price: "₹11",   orig: "₹15",   disc: "27%", cat: "Pain Relief & Balms",            brand: "Volini",      img: U("photo-1616750819574-7e38aa8046fa") },
  { id: 13, name: "Moov Ointment 75g",               sub: "Pain Relief Ointment",       price: "₹60",   orig: "₹75",   disc: "20%", cat: "Pain Relief & Balms",            brand: "Moov",        img: U("photo-1616750819574-7e38aa8046fa") },
  { id: 14, name: "Amrutanjan Maha Strong 48g",      sub: "Extra Strong Balm",          price: "₹40",   orig: "₹48",   disc: "17%", cat: "Pain Relief & Balms",            brand: "Amrutanjan",  img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 15, name: "Amrutanjan Strong 20g",           sub: "Pain Relief Balm",           price: "₹16",   orig: "₹20",   disc: "20%", cat: "Pain Relief & Balms",            brand: "Amrutanjan",  img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 16, name: "Amrutanjan Strong 135g",          sub: "Pain Relief Balm",           price: "₹110",  orig: "₹135",  disc: "19%", cat: "Pain Relief & Balms",            brand: "Amrutanjan",  img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 17, name: "Zandu Balm 45ml",                 sub: "Headache & Pain Balm",       price: "₹40",   orig: "₹45",   disc: "12%", cat: "Pain Relief & Balms",            brand: "Zandu",       img: U("photo-1614162063681-1adc832305b1") },

  // ── Energy, Hydration & Supplements ──
  { id: 18, name: "Glucon D Orange 173g",            sub: "Glucose Energy Drink",       price: "₹138",  orig: "₹173",  disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 19, name: "Glucon D Orange 75g",             sub: "Glucose Energy Drink",       price: "₹60",   orig: "₹75",   disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 20, name: "Glucon D Regular 65g",            sub: "Glucose Energy Drink",       price: "₹50",   orig: "₹65",   disc: "24%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 21, name: "Glucon D Orange 47g",             sub: "Glucose Energy Drink",       price: "₹38",   orig: "₹47",   disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 22, name: "Glucon D Nimbu Pani 415g Jar",    sub: "Lemon Flavour Energy Jar",   price: "₹332",  orig: "₹415",  disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 23, name: "Glucon D Orange 415g Jar",        sub: "Orange Flavour Energy Jar",  price: "₹332",  orig: "₹415",  disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 24, name: "Glucon D Regular Jar 219g",       sub: "Glucose Energy Drink",       price: "₹175",  orig: "₹219",  disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 25, name: "Glucon D Regular Jar 123g",       sub: "Glucose Energy Drink",       price: "₹98",   orig: "₹123",  disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 26, name: "Glucon D Regular 118g",           sub: "Glucose Energy Drink",       price: "₹94",   orig: "₹118",  disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 27, name: "Glucon D Regular Jar 67g",        sub: "Glucose Energy Drink",       price: "₹54",   orig: "₹67",   disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 28, name: "Glucon D Regular Refill 62g",     sub: "Glucose Refill Pack",        price: "₹50",   orig: "₹62",   disc: "19%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 29, name: "Glucon D Regular 31g",            sub: "Glucose Energy Drink",       price: "₹25",   orig: "₹31",   disc: "20%", cat: "Energy, Hydration & Supplements",brand: "Glucon D",    img: U("photo-1693996045463-6ea86d10a2e7") },
  { id: 30, name: "Cipla ORS Powder Box",            sub: "Oral Rehydration Salts",     price: "₹250",  orig: "₹978",  disc: "74%", cat: "Energy, Hydration & Supplements",brand: "Cipla",       img: U("photo-1606607728103-1b48747ad318") },
  { id: 31, name: "Johnson ORS Orange Liquid",       sub: "Oral Rehydration",           price: "₹28",   orig: "₹42",   disc: "33%", cat: "Energy, Hydration & Supplements",brand: "Johnson's",   img: U("photo-1732901379250-03be48f04241") },
  { id: 32, name: "Johnson ORS Lemon Liquid",        sub: "Oral Rehydration",           price: "₹25",   orig: "₹37",   disc: "32%", cat: "Energy, Hydration & Supplements",brand: "Johnson's",   img: U("photo-1732901379250-03be48f04241") },
  { id: 33, name: "ORS Cipla Liquid",                sub: "Oral Rehydration",           price: "₹17",   orig: "₹29",   disc: "43%", cat: "Energy, Hydration & Supplements",brand: "Cipla",       img: U("photo-1732901379250-03be48f04241") },
  { id: 34, name: "Electrol Powder Sachet",          sub: "Electrolyte Replacement",    price: "₹16",   orig: "₹23",   disc: "30%", cat: "Energy, Hydration & Supplements",brand: "Electrol",    img: U("photo-1606607728103-1b48747ad318") },
  { id: 35, name: "Dexolac Infant Formula 490g",     sub: "Baby Nutrition Formula",     price: "₹410",  orig: "₹490",  disc: "16%", cat: "Energy, Hydration & Supplements",brand: "Wockhardt",   img: U("photo-1691480208637-6ed63aac6694") },
  { id: 36, name: "Dabur Honey 125g",                sub: "Pure Natural Honey",         price: "₹105",  orig: "₹125",  disc: "16%", cat: "Energy, Hydration & Supplements",brand: "Dabur",       img: U("photo-1613548058193-1cd24c1bebcf") },
  { id: 37, name: "Dabur Chyawanprash 860g",         sub: "Ayurvedic Health Tonic",     price: "₹671",  orig: "₹860",  disc: "22%", cat: "Energy, Hydration & Supplements",brand: "Dabur",       img: U("photo-1629240830845-e4a550a6bbde") },
  { id: 38, name: "Dabur Chyawanprash 450g",         sub: "Ayurvedic Health Tonic",     price: "₹351",  orig: "₹450",  disc: "22%", cat: "Energy, Hydration & Supplements",brand: "Dabur",       img: U("photo-1629240830845-e4a550a6bbde") },
  { id: 39, name: "Sugar Free Gold 40 Tabs",         sub: "Low Calorie Sweetener",      price: "₹32",   orig: "₹40",   disc: "19%", cat: "Energy, Hydration & Supplements",brand: "Zydus",       img: U("photo-1664956617303-83e06c068f7f") },

  // ── First Aid & Antiseptics ──
  { id: 40, name: "Dettol Antiseptic Liquid 250ml",  sub: "Antiseptic Solution",        price: "₹131",  orig: "₹155",  disc: "15%", cat: "First Aid & Antiseptics",        brand: "Dettol",      img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 41, name: "Dettol Antiseptic Liquid 120ml",  sub: "Antiseptic Solution",        price: "₹70",   orig: "₹81",   disc: "14%", cat: "First Aid & Antiseptics",        brand: "Dettol",      img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 42, name: "Dettol Antiseptic Liquid 60ml",   sub: "Antiseptic Solution",        price: "₹27",   orig: "₹30",   disc: "10%", cat: "First Aid & Antiseptics",        brand: "Dettol",      img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 43, name: "Dettol Antiseptic Liquid 550ml",  sub: "Antiseptic Solution",        price: "₹223",  orig: "₹259",  disc: "14%", cat: "First Aid & Antiseptics",        brand: "Dettol",      img: U("photo-1559743344-950d2d9458cc") },
  { id: 44, name: "Dettol Antiseptic Liquid Large",  sub: "Antiseptic Solution",        price: "₹285",  orig: "₹331",  disc: "14%", cat: "First Aid & Antiseptics",        brand: "Dettol",      img: U("photo-1559743344-950d2d9458cc") },
  { id: 45, name: "Dettol Antiseptic Liquid 30ml",   sub: "Antiseptic Solution",        price: "₹29",   orig: "₹33",   disc: "12%", cat: "First Aid & Antiseptics",        brand: "Dettol",      img: U("photo-1559743344-950d2d9458cc") },
  { id: 46, name: "Hansaplast Regular Band-Aid",     sub: "Adhesive Bandage Box",       price: "₹165",  orig: "₹240",  disc: "31%", cat: "First Aid & Antiseptics",        brand: "Hansaplast",  img: U("photo-1635091237278-a882f31bc310") },
  { id: 47, name: "Hansaplast Washproof Band-Aid",   sub: "Waterproof Bandage Box",     price: "₹195",  orig: "₹300",  disc: "35%", cat: "First Aid & Antiseptics",        brand: "Hansaplast",  img: U("photo-1776047129625-50b8c7299705") },

  // ── Antacids, Digestion & Laxatives ──
  { id: 48, name: "Eno Lemon 30 Pcs Pack",           sub: "Antacid Sachet Pack",        price: "₹230",  orig: "",      disc: "",    cat: "Antacids, Digestion & Laxatives",brand: "Eno",         img: U("photo-1664956617303-83e06c068f7f") },
  { id: 49, name: "Eno Cola Sachet 5g",              sub: "Antacid Sachet",             price: "₹7.50", orig: "",      disc: "",    cat: "Antacids, Digestion & Laxatives",brand: "Eno",         img: U("photo-1606607728103-1b48747ad318") },
  { id: 50, name: "Eno Lemon Sachet 5g",             sub: "Antacid Sachet",             price: "₹7.50", orig: "₹9",    disc: "17%", cat: "Antacids, Digestion & Laxatives",brand: "Eno",         img: U("photo-1606607728103-1b48747ad318") },
  { id: 51, name: "Zandu Nityam Tablets",            sub: "Constipation Relief",        price: "₹61",   orig: "₹99",   disc: "38%", cat: "Antacids, Digestion & Laxatives",brand: "Zandu",       img: U("photo-1734607403132-40350099c752") },
  { id: 52, name: "Softovac SF Powder 229g",         sub: "Laxative Powder",            price: "₹150",  orig: "₹229",  disc: "34%", cat: "Antacids, Digestion & Laxatives",brand: "Lupin",       img: U("photo-1664956617303-83e06c068f7f") },
  { id: 53, name: "Pet Safa Herbal Laxative",        sub: "Constipation Relief",        price: "₹94",   orig: "₹115",  disc: "18%", cat: "Antacids, Digestion & Laxatives",brand: "Pet Safa",    img: U("photo-1664956617303-83e06c068f7f") },
  { id: 54, name: "Baidya Isabgol 360g",             sub: "Psyllium Husk Fibre",        price: "₹305",  orig: "₹360",  disc: "15%", cat: "Antacids, Digestion & Laxatives",brand: "Baidya",      img: U("photo-1664956617303-83e06c068f7f") },
  { id: 55, name: "Kayam Churna 115g",               sub: "Digestive Laxative Powder",  price: "₹93",   orig: "₹115",  disc: "19%", cat: "Antacids, Digestion & Laxatives",brand: "Sheth",       img: U("photo-1664956617303-83e06c068f7f") },

  // ── Skin Care, Powders & Ointments ──
  { id: 56, name: "Nycil Cool Powder 130g",          sub: "Prickly Heat Powder",        price: "₹104",  orig: "₹130",  disc: "20%", cat: "Skin Care, Powders & Ointments", brand: "Nycil",       img: U("photo-1733348188703-ad5a2e7d0d76") },
  { id: 57, name: "Nycil Cool Powder 159g",          sub: "Prickly Heat Powder",        price: "₹115",  orig: "₹159",  disc: "28%", cat: "Skin Care, Powders & Ointments", brand: "Nycil",       img: U("photo-1733348188703-ad5a2e7d0d76") },
  { id: 58, name: "Ring Guard Cream 96g",            sub: "Antifungal Cream",           price: "₹78",   orig: "₹96",   disc: "19%", cat: "Skin Care, Powders & Ointments", brand: "Ring Guard",  img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 59, name: "Ring Guard Chain 18g",            sub: "Antifungal Cream",           price: "₹15",   orig: "₹18",   disc: "14%", cat: "Skin Care, Powders & Ointments", brand: "Ring Guard",  img: U("photo-1638609927040-8a7e97cd9d6a") },
  { id: 60, name: "Itch Guard Cream 16.5g",          sub: "Antifungal Cream",           price: "₹14",   orig: "₹17",   disc: "15%", cat: "Skin Care, Powders & Ointments", brand: "Itch Guard",  img: U("photo-1616750819574-7e38aa8046fa") },
  { id: 61, name: "Candid Dusting Powder 174g",      sub: "Antifungal Dusting Powder",  price: "₹122",  orig: "₹174",  disc: "30%", cat: "Skin Care, Powders & Ointments", brand: "Candid",      img: U("photo-1750780536033-483faf4d28b2") },
  { id: 62, name: "Candid Dusting Powder 104g",      sub: "Antifungal Dusting Powder",  price: "₹73",   orig: "₹104",  disc: "30%", cat: "Skin Care, Powders & Ointments", brand: "Candid",      img: U("photo-1750780536033-483faf4d28b2") },
  { id: 63, name: "B-Tex Antifungal Cream 30g",      sub: "Skin Infection Cream",       price: "₹21",   orig: "₹30",   disc: "30%", cat: "Skin Care, Powders & Ointments", brand: "B-Tex",       img: U("photo-1614162063681-1adc832305b1") },
  { id: 64, name: "Salical Cream 25g",               sub: "Skin Care Cream",            price: "₹18",   orig: "₹25",   disc: "28%", cat: "Skin Care, Powders & Ointments", brand: "Salical",     img: U("photo-1614162063681-1adc832305b1") },
  { id: 65, name: "Suthol Neem Antiseptic 50ml",     sub: "Antiseptic Liquid",          price: "₹41",   orig: "₹50",   disc: "18%", cat: "Skin Care, Powders & Ointments", brand: "Suthol",      img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 66, name: "Suthol Neem Spray 80ml",          sub: "Antiseptic Spray",           price: "₹66",   orig: "₹80",   disc: "17%", cat: "Skin Care, Powders & Ointments", brand: "Suthol",      img: U("photo-1583687809174-d8db66b1b7fd") },
  { id: 67, name: "Boroline Antiseptic Cream Jar",   sub: "Night Cream 480g",           price: "₹420",  orig: "₹480",  disc: "13%", cat: "Skin Care, Powders & Ointments", brand: "Boroline",    img: U("photo-1620306805869-1bd9ea04b055") },
  { id: 68, name: "Boroline Antiseptic Cream 45g",   sub: "Antiseptic Cream",           price: "₹39",   orig: "₹45",   disc: "13%", cat: "Skin Care, Powders & Ointments", brand: "Boroline",    img: U("photo-1638609927040-8a7e97cd9d6a") },

  // ── Personal Care, Hygiene & Others ──
  { id: 69, name: "Jac Body Oil 75ml",               sub: "Moisturising Body Oil",      price: "₹53",   orig: "₹75",   disc: "29%", cat: "Personal Care, Hygiene & Others",brand: "Jac",         img: U("photo-1700107650012-36feae7e18ed") },
  { id: 70, name: "Jac Body Oil 135ml",              sub: "Moisturising Body Oil",      price: "₹95",   orig: "₹135",  disc: "30%", cat: "Personal Care, Hygiene & Others",brand: "Jac",         img: U("photo-1700107650012-36feae7e18ed") },
  { id: 71, name: "Jac Body Oil 180ml",              sub: "Moisturising Body Oil",      price: "₹126",  orig: "₹180",  disc: "30%", cat: "Personal Care, Hygiene & Others",brand: "Jac",         img: U("photo-1700107650012-36feae7e18ed") },
  { id: 72, name: "Jac Body Oil 275ml",              sub: "Moisturising Body Oil",      price: "₹193",  orig: "₹275",  disc: "30%", cat: "Personal Care, Hygiene & Others",brand: "Jac",         img: U("photo-1700107650012-36feae7e18ed") },
  { id: 73, name: "Love Nature Hair Oil 299ml",      sub: "Natural Hair Oil",           price: "₹165",  orig: "₹299",  disc: "45%", cat: "Personal Care, Hygiene & Others",brand: "Love Nature",  img: U("photo-1768548658056-f5cbb2d3d795") },
  { id: 74, name: "Veet Hair Remover 99g",           sub: "Hair Removal Cream",         price: "₹87",   orig: "₹99",   disc: "12%", cat: "Personal Care, Hygiene & Others",brand: "Veet",        img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 75, name: "V Wash Plus 50ml",                sub: "Intimate Hygiene Wash",      price: "₹40",   orig: "₹50",   disc: "20%", cat: "Personal Care, Hygiene & Others",brand: "V Wash",      img: U("photo-1627495395570-d2c94e3319f5") },
  { id: 76, name: "Dettol Hand Sanitizer 30ml",      sub: "Hand Sanitizer",             price: "₹26",   orig: "₹30",   disc: "13%", cat: "Personal Care, Hygiene & Others",brand: "Dettol",      img: U("photo-1628771066235-78f074cdc9d6") },
  { id: 77, name: "Dettol Soap",                     sub: "Antibacterial Soap",         price: "₹89",   orig: "",      disc: "",    cat: "Personal Care, Hygiene & Others",brand: "Dettol",      img: U("photo-1559743344-950d2d9458cc") },
  { id: 78, name: "Bengal's Pheneol 88ml",           sub: "Household Disinfectant",     price: "₹69",   orig: "₹88",   disc: "22%", cat: "Personal Care, Hygiene & Others",brand: "Bengal",      img: U("photo-1668025757022-a75458371576") },
  { id: 79, name: "Vicks Cough Drops 130 Pcs",       sub: "Menthol Cough Drops",        price: "₹100",  orig: "",      disc: "",    cat: "Personal Care, Hygiene & Others",brand: "Vicks",       img: U("photo-1655313719848-23d645684e4a") },

  // ── Baby Care ──
  { id: 80, name: "Morisons Baby Nipple",            sub: "Silicone Nipple",            price: "₹21",   orig: "₹30",   disc: "30%", cat: "Baby Care",                      brand: "Morisons",    img: U("photo-1623707430616-d9f956bcac2b") },
  { id: 81, name: "Morisons Feeding Bottle",         sub: "Baby Feeding Bottle",        price: "₹72",   orig: "",      disc: "",    cat: "Baby Care",                      brand: "Morisons",    img: U("photo-1635258559918-ed56f88004de") },

  // ── Medical Supplies & General ──
  { id: 82, name: "Surgical Face Mask Box 75pc",     sub: "3-Ply Disposable Mask",      price: "₹75",   orig: "",      disc: "",    cat: "Medical Supplies & General",     brand: "Generic",     img: U("photo-1586975949231-9374052a0d63") },
  { id: 83, name: "Surgical Face Mask Box 100pc",    sub: "3-Ply Disposable Mask",      price: "₹100",  orig: "",      disc: "",    cat: "Medical Supplies & General",     brand: "Generic",     img: U("photo-1604116395843-94f7b28a8080") },
  { id: 84, name: "Glandiner Oil 145ml",             sub: "Massage Oil",                price: "₹120",  orig: "₹145",  disc: "17%", cat: "Medical Supplies & General",     brand: "Glandiner",   img: U("photo-1700107650012-36feae7e18ed") },
];

const CATEGORY_LIST = [
  "All",
  "Pain Relief & Balms",
  "Energy, Hydration & Supplements",
  "First Aid & Antiseptics",
  "Antacids, Digestion & Laxatives",
  "Skin Care, Powders & Ointments",
  "Personal Care, Hygiene & Others",
  "Baby Care",
  "Medical Supplies & General",
];

const ALL_BRANDS = [...new Set(ALL_PRODUCTS.map((p) => p.brand))].sort();

const PRICE_RANGES = [
  { label: "Under ₹50",    min: 0,    max: 50 },
  { label: "₹50 – ₹149",  min: 50,   max: 149 },
  { label: "₹150 – ₹499", min: 150,  max: 499 },
  { label: "₹500+",       min: 500,  max: Infinity },
];

function parsePrice(p: string) {
  return parseFloat(p.replace(/[₹,]/g, "")) || 0;
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
      <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Collapsible({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#e4ede2] pb-4">
      <button className="w-full flex items-center justify-between py-3 font-bold text-[#073b4c] text-sm" onClick={() => setOpen(!open)}>
        {title} <ChevronDownIcon open={open} />
      </button>
      {open && <div className="flex flex-col gap-2">{children}</div>}
    </div>
  );
}

export default function MedicinesPage({
  initialCategory = "All",
  userRole,
  onNavigate,
}: {
  initialCategory?: string;
  userRole?: string;
  onNavigate?: (page: string) => void;
}) {
  const { addToCart } = useCart();
  const isRetailer = userRole === "retailer";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [activeKeyCat, setActiveKeyCat] = useState(() => {
    const found = KEY_CATEGORIES.find(
      (k) => k.filterCat === initialCategory || k.name.toLowerCase() === initialCategory.toLowerCase()
    );
    return found ? found.id : "all";
  });
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<PopupProduct | null>(null);
  const [dbProducts, setDbProducts] = useState<DbProduct[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const PER_PAGE = 24;

  const handleSelectKeyCategory = (cat: KeyCategoryItem) => {
    setActiveKeyCat(cat.id);
    setPage(1);

    if (cat.id === "insurance") {
      setShowInsuranceModal(true);
      return;
    }
    if (cat.route && onNavigate) {
      onNavigate(cat.route);
      return;
    }

    if (cat.filterCat) {
      setSelectedCategory(cat.filterCat);
    } else {
      setSelectedCategory(cat.name);
    }
  };

  useEffect(() => {
    setSelectedCategory(initialCategory);
    const found = KEY_CATEGORIES.find(
      (k) => k.filterCat === initialCategory || k.name.toLowerCase() === initialCategory.toLowerCase()
    );
    setActiveKeyCat(found ? found.id : (initialCategory === "All" ? "all" : ""));
  }, [initialCategory]);

  useEffect(() => {
    let mounted = true;
    setLoadingProducts(true);
    fetchProducts().then((data) => {
      if (mounted) {
        if (data && data.length > 0) {
          setDbProducts(data);
        }
        setLoadingProducts(false);
      }
    }).catch(() => {
      if (mounted) setLoadingProducts(false);
    });

    // Real-time Supabase subscription for live stock and product updates
    const unsubscribe = subscribeToProductsRealtime((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        setDbProducts((prev) => {
          if (!prev) return [payload.new];
          return prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p));
        });
      } else if (payload.eventType === "INSERT" && payload.new) {
        setDbProducts((prev) => (prev ? [payload.new, ...prev] : [payload.new]));
      } else if (payload.eventType === "DELETE" && payload.old) {
        setDbProducts((prev) => (prev ? prev.filter((p) => p.id !== payload.old.id) : []));
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const productList = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => ({
        id: p.numeric_id,
        dbId: p.id,
        name: p.name,
        sub: p.details || p.subtitle || "",
        price: `₹${Math.round(p.customer_price)}`,
        retailerPrice: `₹${Math.round(p.retailer_price)}`,
        orig: p.mrp > p.customer_price ? `₹${Math.round(p.mrp)}` : "",
        disc: p.discount_percent > 0 ? `${p.discount_percent}%` : "",
        cat: p.category_name,
        brand: p.brand,
        img: p.image_url,
        stock: p.stock ?? 50,
      }));
    }
    return ALL_PRODUCTS.map((p) => ({ ...p, stock: 50 }));
  }, [dbProducts]);

  const toggleBrand = (b: string) =>
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  const activeFilterCount = selectedBrands.length + (selectedPriceIdx !== null ? 1 : 0);

  const filtered = useMemo(() => {
    let list = productList;

    // Filter by Key Category ID or selected category
    if (activeKeyCat === "50-off") {
      list = list.filter((p) => parseInt(p.disc || "0") >= 20 || parseInt(p.orig ? "1" : "0") > 0);
    } else if (activeKeyCat === "skin") {
      list = list.filter((p) =>
        p.cat.includes("Skin") ||
        /cream|powder|ointment|antifungal|gel|boroline|salical|b-tex|ring guard/i.test(p.name + " " + p.sub)
      );
    } else if (activeKeyCat === "weight-loss") {
      list = list.filter((p) =>
        /sugar free|isabgol|softovac|weight|slimming|supplement|diet|chyawanprash/i.test(p.name + " " + p.sub + " " + p.cat)
      );
    } else if (activeKeyCat === "wellness") {
      list = list.filter((p) =>
        p.cat.includes("Energy") ||
        /wellness|chyawanprash|honey|ors|glucon|tonic|ayurvedic/i.test(p.name + " " + p.sub)
      );
    } else if (activeKeyCat === "monsoon") {
      list = list.filter((p) =>
        /dettol|antiseptic|hansaplast|suthol|dusting|candid|cough|vicks|boroline/i.test(p.name + " " + p.sub + " " + p.cat)
      );
    } else if (activeKeyCat === "baby") {
      list = list.filter((p) => p.cat.includes("Baby") || /baby|nipple|bottle/i.test(p.name + " " + p.sub));
    } else if (activeKeyCat === "women") {
      list = list.filter((p) =>
        /v wash|veet|hair remover|body oil|intimate|women|hygiene|skincare/i.test(p.name + " " + p.sub + " " + p.cat)
      );
    } else if (activeKeyCat === "men") {
      list = list.filter((p) =>
        /balm|volini|amrutanjan|energy|glucon|pain relief|oil|soap|sanitizer/i.test(p.name + " " + p.sub + " " + p.cat)
      );
    } else if (activeKeyCat === "vaccines") {
      list = list.filter((p) =>
        /mask|surgical|dettol|sanitizer|first aid|medical|antiseptic/i.test(p.name + " " + p.sub + " " + p.cat)
      );
    } else if (activeKeyCat === "diet") {
      list = list.filter((p) =>
        p.cat.includes("Digestion") ||
        /eno|sugar free|isabgol|softovac|pet safa|honey|ors|laxative/i.test(p.name + " " + p.sub)
      );
    } else if (activeKeyCat === "hair") {
      list = list.filter((p) =>
        /hair|oil|love nature|scalp|shampoo|dandruff|body oil/i.test(p.name + " " + p.sub + " " + p.cat)
      );
    } else if (selectedCategory !== "All") {
      list = list.filter((p) => p.cat === selectedCategory);
    }

    if (selectedBrands.length) {
      list = list.filter((p) => selectedBrands.includes(p.brand));
    }
    if (selectedPriceIdx !== null) {
      const r = PRICE_RANGES[selectedPriceIdx];
      list = list.filter((p) => {
        const v = parsePrice(isRetailer && p.retailerPrice ? p.retailerPrice : p.price);
        return v >= r.min && v <= r.max;
      });
    }
    if (sortBy === "price-asc") {
      list = [...list].sort((a, b) => parsePrice(isRetailer ? a.retailerPrice : a.price) - parsePrice(isRetailer ? b.retailerPrice : b.price));
    }
    if (sortBy === "price-desc") {
      list = [...list].sort((a, b) => parsePrice(isRetailer ? b.retailerPrice : b.price) - parsePrice(isRetailer ? a.retailerPrice : a.price));
    }
    if (sortBy === "discount") {
      list = [...list].sort((a, b) => parseInt(b.disc || "0") - parseInt(a.disc || "0"));
    }
    return list;
  }, [productList, activeKeyCat, selectedCategory, selectedBrands, selectedPriceIdx, sortBy, isRetailer]);

  const paginated = filtered.slice(0, page * PER_PAGE);

  return (
    <div className="bg-[#f5fbf2] min-h-screen">
      {/* Retailer pricing banner */}
      {isRetailer && (
        <div className="bg-[#073b4c] text-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-2 sm:py-2.5 flex items-center gap-2.5 sm:gap-3">
            <span className="bg-[#0369a1] text-white text-[10px] font-bold px-2 py-0.5 sm:py-1 rounded uppercase tracking-wide shrink-0">Retailer</span>
            <p className="text-xs sm:text-sm font-medium">
              Viewing <span className="font-bold text-[#7dd3fc]">wholesale retailer prices</span> — approx. 15-20% below standard MRP for verified store owners.
            </p>
          </div>
        </div>
      )}

      {/* Key Categories Bar (All 14 categories) */}
      <KeyCategoriesBar
        selectedId={activeKeyCat}
        onSelectCategory={handleSelectKeyCategory}
      />

      {/* Page header */}
      <div className="bg-white border-b border-[#e4ede2]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl sm:text-3xl">
                {KEY_CATEGORIES.find((k) => k.id === activeKeyCat)?.name || selectedCategory}
              </h1>
              <span className="bg-[#e8f5ee] text-[#006a39] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#bbf7d0]">
                {filtered.length} items
              </span>
            </div>
            <p className="text-[#6d7a6f] text-xs sm:text-sm mt-0.5 sm:mt-1">
              Live Verified Inventory · Genuine Quality Guaranteed
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl border border-[#d5dcd3] bg-white text-[#073b4c] text-xs sm:text-sm font-semibold hover:border-[#006a39] transition-colors cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {showFilters ? "Hide Filters" : "Show Filters"}
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#006a39] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="px-3 sm:px-4 py-2 rounded-xl border border-[#d5dcd3] bg-white text-[#073b4c] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#006a39] cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="discount">Best Discount</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-6 flex flex-col md:flex-row gap-5 sm:gap-6">
        {/* Mobile filter drawer backdrop */}
        {showFilters && (
          <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setShowFilters(false)} />
        )}

        {/* Filter sidebar — drawer on mobile, column on md+ */}
        {showFilters && (
          <aside className="fixed bottom-0 left-0 right-0 z-50 md:static md:w-52 md:shrink-0 md:z-auto">
            <div className="bg-white rounded-t-2xl md:rounded-2xl border border-[#e4ede2] p-4 md:sticky md:top-20 max-h-[80vh] md:max-h-none overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#e4ede2] mb-1">
                <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c]">Filters</span>
                <div className="flex items-center gap-2">
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setSelectedBrands([]); setSelectedPriceIdx(null); }} className="text-[#006a39] text-xs font-semibold hover:underline">
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setShowFilters(false)} className="md:hidden w-7 h-7 rounded-full bg-[#f0f4f0] flex items-center justify-center text-[#073b4c]">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </div>
              <Collapsible title="Price Range">
                {PRICE_RANGES.map((r, i) => (
                  <label key={r.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" checked={selectedPriceIdx === i} onChange={() => setSelectedPriceIdx(selectedPriceIdx === i ? null : i)} className="accent-[#006a39]" />
                    <span className="text-[#3e4a3f] text-xs">{r.label}</span>
                  </label>
                ))}
              </Collapsible>
              <Collapsible title="Brand" defaultOpen={false}>
                <div className="max-h-52 overflow-y-auto flex flex-col gap-2 pr-1">
                  {ALL_BRANDS.map((b) => (
                    <label key={b} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-[#006a39]" />
                      <span className="text-[#3e4a3f] text-xs truncate">{b}</span>
                    </label>
                  ))}
                </div>
              </Collapsible>
            </div>
          </aside>
        )}

        {/* Products grid */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <p className="text-[#6d7a6f] text-xs sm:text-sm">
            Showing <span className="font-semibold text-[#073b4c]">{paginated.length}</span> of{" "}
            <span className="font-semibold text-[#073b4c]">{filtered.length}</span> products
            {selectedCategory !== "All" && (
              <> in{" "}
                <span className="font-semibold" style={{ color: CAT_COLORS[selectedCategory] }}>
                  {selectedCategory}
                </span>
              </>
            )}
          </p>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="font-bold text-[#073b4c] text-lg">No products found</p>
              <button onClick={() => { setSelectedBrands([]); setSelectedPriceIdx(null); }} className="bg-[#006a39] text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-[#005a30] transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className={`grid gap-3 sm:gap-4 ${showFilters ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
                {paginated.map((p) => {
                  const accentColor = CAT_COLORS[p.cat] || "#006a39";
                  const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                  const isLowStock = p.stock !== undefined && p.stock > 0 && p.stock <= 10;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`bg-white rounded-2xl border ${isOutOfStock ? "border-red-200 opacity-80" : "border-[#e4ede2]"} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col group cursor-pointer`}
                    >
                      <div className="relative bg-[#f8fafb] h-32 sm:h-36 overflow-hidden">
                        {p.disc && (
                          <span className="absolute top-2 left-2 z-10 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: accentColor }}>
                            {p.disc} OFF
                          </span>
                        )}
                        {isOutOfStock ? (
                          <span className="absolute top-2 right-2 z-10 bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="absolute top-2 right-2 z-10 bg-[#fef3c7] text-[#b45309] border border-[#fde68a] text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase animate-pulse">
                            Only {p.stock} Left
                          </span>
                        ) : (
                          <span className="absolute top-2 right-2 z-10 bg-[#d1fae5]/90 text-[#047857] text-[8px] font-bold px-1.5 py-0.5 rounded">
                            {p.stock} in stock
                          </span>
                        )}
                        <img
                          src={p.img}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }}
                        />
                      </div>
                      <div className="p-3 flex flex-col gap-0.5 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.5px]" style={{ color: accentColor }}>{p.brand}</p>
                        <p className="font-bold text-[#073b4c] text-[11px] leading-[14px] line-clamp-2">{p.name}</p>
                        {p.sub && (
                          <span className="inline-block text-[9px] font-bold bg-[#f0fdf4] text-[#047857] border border-[#bbf7d0] px-1.5 py-0.5 rounded-full leading-none mt-0.5">{p.sub}</span>
                        )}
                        <div className="mt-auto pt-2">
                          {isRetailer ? (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-['Manrope',sans-serif] font-bold text-[#0369a1] text-sm">{retailerPrice(p.price)}</span>
                                <span className="text-[9px] bg-[#dbeafe] text-[#1d4ed8] px-1.5 py-0.5 rounded font-bold uppercase">Retailer</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[#9aa89b] text-[9px]">Customer: </span>
                                <span className="text-[#9aa89b] text-[10px] line-through">{p.price}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-sm">{p.price}</span>
                              {p.orig && <span className="text-[#9aa89b] text-[10px] line-through">MRP {p.orig}</span>}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[9px] mt-1">
                            <span className="text-[#c0ccc0]">HSN: {HSN_BY_CAT[p.cat] ?? "—"}</span>
                            {isOutOfStock ? (
                              <span className="text-[#dc2626] font-bold">Out of stock</span>
                            ) : isLowStock ? (
                              <span className="text-[#d97706] font-semibold">{p.stock} units left</span>
                            ) : (
                              <span className="text-[#059669] font-medium">{p.stock} units available</span>
                            )}
                          </div>
                        </div>
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="w-full mt-1.5 py-1.5 rounded-xl bg-[#f3f4f6] text-[#9ca3af] text-[10px] font-bold tracking-[0.4px] cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            Out of Stock
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className="w-full mt-1.5 py-1.5 rounded-xl text-white text-[10px] font-bold tracking-[0.4px] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
                            style={{ backgroundColor: accentColor }}
                          >
                            <PlusIcon /> Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {paginated.length < filtered.length && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => setPage((n) => n + 1)}
                    className="bg-white border-2 border-[#006a39] text-[#006a39] font-bold text-sm px-10 py-3 rounded-xl hover:bg-[#006a39] hover:text-white transition-all"
                  >
                    Load More ({filtered.length - paginated.length} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isRetailer={isRetailer}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <InsuranceModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        isRetailer={isRetailer}
      />
    </div>
  );
}
