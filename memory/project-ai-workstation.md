# AI Workstation Build Tracker (Threadripper Pro + 4x 3090)

## Build Strategy
Start with a **2-GPU (48GB VRAM) base** that is pre-wired for **4-GPU (96GB VRAM) expansion**.
The core (Motherboard, CPU, Case) must handle 128 PCIe lanes and dual Power Supplies to avoid future bottlenecks or tear-downs.

## Component Checklist (Phase 1: 2x 3090)

### 1. The Core (The "Spine")
- [ ] **CPU:** AMD Threadripper PRO 3955WX (16-Core, 128 PCIe 4.0 lanes)
  - *Target Price:* ~$450
  - *Note:* Do NOT buy "Lenovo Locked" chips. Must be unlocked/retail.
- [ ] **Motherboard:** WRX80 Chipset (e.g., ASUS Pro WS WRX80E-SAGE SE WIFI)
  - *Target Price:* ~$700
  - *Note:* Essential for 7x PCIe 4.0 x16 slots spaced for GPUs.
- [ ] **System RAM:** 128GB (4x 32GB or 8x 16GB) DDR4 ECC Registered Memory
  - *Target Price:* ~$200
  - *Note:* Threadripper Pro supports 8-channel memory. 128GB is needed to comfortably exceed the final 96GB of VRAM.
- [ ] **Storage:** 2TB NVMe Gen4 SSD (e.g., Samsung 980/990 Pro or WD Black SN850X)
  - *Target Price:* ~$150

### 2. The Compute (The "Muscle")
- [ ] **GPU 1:** Used NVIDIA RTX 3090 (24GB VRAM)
  - *Target Price:* ~$700
  - *Note:* Blower-style (like ASUS Turbo or Gigabyte Turbo) is best for stacking 4 cards. Otherwise, look for Founders Edition or standard 3-slot cards and plan for high airflow.
- [ ] **GPU 2:** Used NVIDIA RTX 3090 (24GB VRAM)
  - *Target Price:* ~$700

### 3. Power, Cooling & Chassis
- [ ] **Power Supply 1 (Primary):** 1600W 80+ Titanium/Platinum (e.g., EVGA SuperNOVA, Corsair AX1600i)
  - *Target Price:* ~$250 - $350
  - *Note:* This handles the entire system + 2 GPUs.
- [ ] **CPU Cooler:** Noctua NH-U14S TR4-SP3 or IceGiant ProSiphon Elite (Air) OR 360mm AIO (Liquid)
  - *Target Price:* ~$100 - $150
- [ ] **Case:** Massive E-ATX Workstation Chassis (e.g., Phanteks Enthoo Pro 2 or Fractal Design Meshify 2 XL / Define 7 XL)
  - *Target Price:* ~$150 - $200
  - *Note:* Must fit an SSI-EEB/E-ATX motherboard and support *two* power supplies (Enthoo Pro 2 supports dual PSUs natively).
- [ ] **Case Fans:** 5-7x High Static Pressure 140mm Fans (e.g., Noctua, Arctic P14)
  - *Target Price:* ~$50 - $80

**Total Phase 1 Estimated Cost:** ~$3,200 - $3,500

---

## Component Checklist (Phase 2: Expansion to 4x 3090)

When you are ready for 96GB VRAM to run massive, unquantized models or heavy multi-batch fine-tuning:

- [ ] **GPU 3:** Used NVIDIA RTX 3090 (24GB VRAM)
  - *Target Price:* ~$700
- [ ] **GPU 4:** Used NVIDIA RTX 3090 (24GB VRAM)
  - *Target Price:* ~$700
- [ ] **Power Supply 2 (Secondary):** 1000W+ 80+ Gold/Platinum
  - *Target Price:* ~$150
  - *Note:* Needs a dual PSU adapter cable (24-pin splitter) to sync power-on with the primary PSU.

**Total Phase 2 Upgrade Cost:** ~$1,550

---

## Software & OS Plan
- **OS:** Ubuntu Linux (22.04 LTS or 24.04 LTS) Server or Desktop. Do not use Windows for multi-GPU AI workloads.
- **Drivers:** NVIDIA Proprietary Drivers (535 or newer)
- **Frameworks:** CUDA Toolkit, PyTorch, vLLM, Ollama, Docker + NVIDIA Container Toolkit.

## Next Steps
- [ ] Confirm chassis choice (ensure it fits 4x 3090s based on the exact models you find on eBay).
- [ ] Start hunting eBay for the WRX80 Motherboard and 3955WX CPU combo.
- [ ] Set up eBay alerts for "RTX 3090 Blower" or "RTX 3090 Turbo".