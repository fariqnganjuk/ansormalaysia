# NU Malaysia Media & PMI Advocacy Website Requirements Document

## 1. Application Overview

### 1.1 Application Name
NU Malaysia Media & PMI Advocacy Platform

### 1.2 Application Description
A comprehensive web platform for Nahdlatul Ulama (NU) organization in Malaysia, focusing on Indonesian migrant workers (PMI) issues, organizational activities, and advocacy services. The platform includes a public-facing website with 10 main pages and a content management dashboard for administrators.

### 1.3 Reference Materials
Reference website: https://ansor.id/

## 2. Core Features

### 2.1 Public Website (10 Pages)

#### Page 1: Beranda (Homepage)
- Large headline section featuring PMI issues and religious matters
- Featured news section
- Breaking news / hot issues section
- Highlights of NU activities and affiliated organizations (Banom)
- Call-to-action button: Laporkan Masalah PMI (Report PMI Issues)
- Navigation menu optimized for desktop display with horizontal scrolling capability to prevent overflow
- Login feature replaced with icon representation

#### Page 2: Berita PMI/Isu Migran (PMI News/Migrant Issues)
- PMI case reports
- Malaysia-Indonesia policy updates
- Protection, legal, and employment information
- Migrant education content

#### Page 3: Organisasi (Organization)
- Information about PCINU, Ansor, Fatayat, Muslimat, and other affiliated organizations
- Activity reports
- Photos with brief press releases

#### Page 4: Kegiatan Organisasi (Organizational Activities)
- Activities of affiliated organizations (Banom)
- News about NU volunteers

#### Page 5: Tokoh & Inspirasi (Figures & Inspiration)
- Profiles of inspirational PMI individuals
- NU figures in Malaysia
- Volunteers and migrant companions

#### Page 6: Opini & Analisis (Opinion & Analysis)
- Articles by NU activists
- PMI figures
- Academics
- Legal practitioners

#### Page 7: Advokasi & Pengaduan Layanan PMI (Advocacy & PMI Complaint Services)
- Complaint form with input validation to prevent XSS and SQL injection attacks
- Volunteer contact information
- Assistance workflow
- Legal disclaimer

#### Page 8: Data & Infografis (Data & Infographics)
- PMI and migration statistics
- Issue maps and trend graphs
- NU activity infographics
- Interactive geotagging feature: clickable map markers that display detailed data when selected

#### Page 9: Tentang Kami (About Us)
- Vision and mission
- Media position (independent)
- Nahdliyin identity (Aswaja)
- Clarification: Not a structural media of PBNU/PCNU

#### Page 10: Kontak dan Kolaborasi (Contact and Collaboration)
- Editorial contact
- Community collaboration opportunities
- Donation/support options
- Media partnership information

### 2.2 Content Management Dashboard
- Content creation and editing interface
- Content publishing and scheduling
- Media library management
- User management for content administrators
- Content categorization and tagging
- Draft and published content management
- Web content management system for all website pages

### 2.3 Security & User Experience
- Input validation across all forms to prevent XSS, SQL injection, and other security vulnerabilities
- URL routing with proper error handling to prevent users from accessing incorrect or non-existent URLs
- 404 error page with helpful navigation options

### 2.4 Responsive Design
- Desktop navigation menu with simplified layout and horizontal scrolling capability
- Icon-based login feature for cleaner interface
- Optimized menu structure to prevent overflow and maintain visual organization

## 3. Reference Files
1. Research Report: /workspace/app-9wnpatirc0e9/docs/report.md