import svgPaths from "./svg-upgjrlc3gn";
import imgLabTesting from "./95108217d5cffd6c578e7bce86ceab631910923e.png";

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 1">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:ExtraBold',sans-serif] font-extrabold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[48px] tracking-[-0.96px] w-full">
        <p className="leading-[56px] mb-0">Precision Diagnostics,</p>
        <p className="leading-[56px] text-[#006a39]">Delivered Home.</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[512px] relative shrink-0 w-[512px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[18px] whitespace-nowrap">
        <p className="leading-[28px] mb-0">Book certified lab tests from the comfort of your home. Fast,</p>
        <p className="leading-[28px] mb-0">accurate, and hygienic sample collection by trained</p>
        <p className="leading-[28px]">professionals.</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[#006a39] content-stretch flex flex-col items-center justify-center px-[24px] py-[13px] relative rounded-[8px] shrink-0" data-name="Button">
      <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[8px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]" data-name="Button:shadow" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Book a Test Now</p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[25px] py-[13px] relative rounded-[8px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#073b4c] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Upload Prescription</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="content-stretch flex gap-[16px] items-start pt-[16px] relative shrink-0 w-full" data-name="Container">
      <Button />
      <Button1 />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-name="Container">
      <Heading />
      <Container1 />
      <Container2 />
    </div>
  );
}

function LabTesting() {
  return (
    <div className="flex-[1_0_0] min-h-px relative w-full" data-name="Lab Testing">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-full left-[-2.81%] max-w-none top-0 w-[105.62%]" src={imgLabTesting} />
      </div>
    </div>
  );
}

function OverlayShadow() {
  return (
    <div className="bg-[rgba(255,255,255,0)] content-stretch flex flex-[1_0_0] flex-col h-[320px] items-start justify-center min-w-px overflow-clip relative rounded-[12px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" data-name="Overlay+Shadow">
      <LabTesting />
    </div>
  );
}

function HeroSection() {
  return (
    <div className="bg-[#eff6ec] relative rounded-[12px] shrink-0 w-full" data-name="Hero Section">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between p-[32px] relative size-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[12px] shadow-[0px_4px_6px_-2px_rgba(7,59,76,0.1)]" data-name="Hero Section:shadow" />
          <Container />
          <OverlayShadow />
        </div>
      </div>
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[32px] w-full">
        <p className="leading-[40px]">Popular Categories</p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[16px] relative shrink-0 w-[22px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 22 16" width="22">
        <g id="Container">
          <path d={svgPaths.p30354100} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="bg-[#bde9ff] relative rounded-[9999px] shrink-0 size-[48px]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container4 />
      </div>
    </div>
  );
}

function Link() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[8px]" data-name="Link">
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center p-[17px] relative size-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[8px] shadow-[0px_2px_4px_-1px_rgba(7,59,76,0.1)]" data-name="Link:shadow" />
          <Background />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
            <p className="leading-[16px]">Full Body Checkup</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[18px] relative shrink-0 w-[14px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 14 18" width="14">
        <g id="Container">
          <path d={svgPaths.p3be98a0} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#bde9ff] relative rounded-[9999px] shrink-0 size-[48px]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container5 />
      </div>
    </div>
  );
}

function Link1() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[8px]" data-name="Link">
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center p-[17px] relative size-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[8px] shadow-[0px_2px_4px_-1px_rgba(7,59,76,0.1)]" data-name="Link:shadow" />
          <Background1 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
            <p className="leading-[16px]">{`Vitamins & Minerals`}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="h-[18px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 20 18" width="20">
        <g id="Container">
          <path d={svgPaths.p2c6eda80} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-[#bde9ff] relative rounded-[9999px] shrink-0 size-[48px]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container6 />
      </div>
    </div>
  );
}

function Link2() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[8px]" data-name="Link">
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center p-[17px] relative size-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[8px] shadow-[0px_2px_4px_-1px_rgba(7,59,76,0.1)]" data-name="Link:shadow" />
          <Background2 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
            <p className="leading-[16px]">Diabetes Screening</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[16px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 20 16" width="20">
        <g id="Container">
          <path d={svgPaths.p3e7e25c0} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#bde9ff] relative rounded-[9999px] shrink-0 size-[48px]" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Container7 />
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[8px]" data-name="Link">
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center p-[17px] relative size-full">
          <div className="absolute bg-[rgba(255,255,255,0)] inset-0 rounded-[8px] shadow-[0px_2px_4px_-1px_rgba(7,59,76,0.1)]" data-name="Link:shadow" />
          <Background3 />
          <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
            <p className="leading-[16px]">Heart Health</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="content-stretch flex gap-[24px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <Link />
      <Link1 />
      <Link2 />
      <Link3 />
    </div>
  );
}

function SectionCategoriesQuickLinksBentoGridStyle() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Section - Categories / Quick Links (Bento Grid Style)">
      <Heading1 />
      <Container3 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[32px] whitespace-nowrap">
        <p className="leading-[40px]">Comprehensive Health Packages</p>
      </div>
    </div>
  );
}

function Link4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">View All Packages</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-name="Container">
      <Heading2 />
      <Link4 />
    </div>
  );
}

function Background4() {
  return (
    <div className="bg-[#00818a] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start px-[8px] py-[4px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[10px] text-white uppercase whitespace-nowrap">
          <p className="leading-[15px]">BESTSELLER</p>
        </div>
      </div>
    </div>
  );
}

function Heading3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[4px] relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] w-full">
          <p className="leading-[32px]">Advanced Full Body Checkup</p>
        </div>
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
          <p className="leading-[20px]">Includes 85 tests (CBC, Lipid, Thyroid, LFT, KFT)</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundHorizontalBorder() {
  return (
    <div className="bg-[#e9f0e7] relative shrink-0 w-full" data-name="Background+HorizontalBorder">
      <div aria-hidden className="absolute border-[#d5dcd3] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start pb-[17px] pt-[18px] px-[16px] relative size-full">
        <Background4 />
        <Heading3 />
        <Container10 />
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container12 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Home sample collection</p>
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container13 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Reports in 24 hours</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item2() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container14 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Free Doctor Consultation</p>
      </div>
    </div>
  );
}

function List() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="List">
      <Item />
      <Item1 />
      <Item2 />
    </div>
  );
}

function ListMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="List:margin">
      <List />
    </div>
  );
}

function Container17() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[20px] whitespace-nowrap">
        <p className="leading-[24px]">$149</p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid leading-[20px] line-through">$299</p>
      </div>
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-[#e3eae1] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#2d6a4f] text-[12px] whitespace-nowrap">
        <p className="leading-[18px]">50% OFF</p>
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Container17 />
      <Container18 />
      <Background5 />
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-[#006a39] content-stretch flex items-center justify-center py-[12px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Book Now</p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Container16 />
      <Button2 />
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between p-[16px] relative size-full">
        <ListMargin />
        <Container15 />
      </div>
    </div>
  );
}

function PackageCard() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Package Card 1">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <BackgroundHorizontalBorder />
        <Container11 />
      </div>
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_4px_6px_-2px_rgba(7,59,76,0.1)]" />
    </div>
  );
}

function Heading4() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] w-full">
          <p className="leading-[32px]">Essential Diabetic Care</p>
        </div>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
          <p className="leading-[20px] mb-0">Includes 32 tests (HbA1c, Fasting Blood Sugar, Lipid</p>
          <p className="leading-[20px]">Profile)</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundHorizontalBorder1() {
  return (
    <div className="bg-[#e9f0e7] relative shrink-0 w-full" data-name="Background+HorizontalBorder">
      <div aria-hidden className="absolute border-[#d5dcd3] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start pb-[17px] pt-[16px] px-[16px] relative size-full">
        <Heading4 />
        <Container19 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item3() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container21 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Home sample collection</p>
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container22 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Reports in 12 hours</p>
      </div>
    </div>
  );
}

function List1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="List">
      <Item3 />
      <Item4 />
    </div>
  );
}

function ListMargin1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="List:margin">
      <List1 />
    </div>
  );
}

function Container25() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[20px] whitespace-nowrap">
        <p className="leading-[24px]">$79</p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid leading-[20px] line-through">$120</p>
      </div>
    </div>
  );
}

function Background6() {
  return (
    <div className="bg-[#e3eae1] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#2d6a4f] text-[12px] whitespace-nowrap">
        <p className="leading-[18px]">34% OFF</p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Container25 />
      <Container26 />
      <Background6 />
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#006a39] content-stretch flex items-center justify-center py-[12px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Book Now</p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Container24 />
      <Button3 />
    </div>
  );
}

function Margin() {
  return (
    <div className="content-stretch flex flex-col h-[117px] items-start justify-end min-h-[76px] pt-[41px] relative shrink-0 w-full" data-name="Margin">
      <Container23 />
    </div>
  );
}

function Container20() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between p-[16px] relative size-full">
        <ListMargin1 />
        <Margin />
      </div>
    </div>
  );
}

function PackageCard1() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Package Card 2">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <BackgroundHorizontalBorder1 />
        <Container20 />
      </div>
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_4px_6px_-2px_rgba(7,59,76,0.1)]" />
    </div>
  );
}

function Heading5() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 3">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] w-full">
          <p className="leading-[32px]">{`Women's Wellness Plus`}</p>
        </div>
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
          <p className="leading-[20px]">Includes 65 tests (Iron, Vitamin D, B12, Thyroid, CBC)</p>
        </div>
      </div>
    </div>
  );
}

function BackgroundHorizontalBorder2() {
  return (
    <div className="bg-[#e9f0e7] relative shrink-0 w-full" data-name="Background+HorizontalBorder">
      <div aria-hidden className="absolute border-[#d5dcd3] border-b border-solid inset-0 pointer-events-none" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start pb-[17px] pt-[16px] px-[16px] relative size-full">
        <Heading5 />
        <Container27 />
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item5() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container29 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Female Phlebotomists available</p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item6() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container30 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Reports in 24 hours</p>
      </div>
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0 size-[15px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 15 15" width="15">
        <g id="Container">
          <path d={svgPaths.p1041200} fill="#2D6A4F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Item7() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Item">
      <Container31 />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">Dietitian Consultation</p>
      </div>
    </div>
  );
}

function List2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="List">
      <Item5 />
      <Item6 />
      <Item7 />
    </div>
  );
}

function ListMargin2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[16px] relative shrink-0 w-full" data-name="List:margin">
      <List2 />
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[20px] whitespace-nowrap">
        <p className="leading-[24px]">$129</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-from-font decoration-solid leading-[20px] line-through">$250</p>
      </div>
    </div>
  );
}

function Background7() {
  return (
    <div className="bg-[#e3eae1] content-stretch flex flex-col items-start px-[8px] py-[2px] relative rounded-[4px] shrink-0" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#2d6a4f] text-[12px] whitespace-nowrap">
        <p className="leading-[18px]">48% OFF</p>
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full" data-name="Container">
      <Container34 />
      <Container35 />
      <Background7 />
    </div>
  );
}

function Button4() {
  return (
    <div className="content-stretch flex items-center justify-center px-px py-[13px] relative rounded-[8px] shrink-0 w-full" data-name="Button">
      <div aria-hidden className="absolute border border-[#006a39] border-solid inset-0 pointer-events-none rounded-[8px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Book Now</p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <Container33 />
      <Button4 />
    </div>
  );
}

function Margin1() {
  return (
    <div className="content-stretch flex flex-col h-[109px] items-start justify-end min-h-[78px] pt-[31px] relative shrink-0 w-full" data-name="Margin">
      <Container32 />
    </div>
  );
}

function Container28() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between p-[16px] relative size-full">
        <ListMargin2 />
        <Margin1 />
      </div>
    </div>
  );
}

function PackageCard2() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Package Card 3">
      <div className="content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <BackgroundHorizontalBorder2 />
        <Container28 />
      </div>
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_4px_6px_-2px_rgba(7,59,76,0.1)]" />
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex gap-[24px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <PackageCard />
      <PackageCard1 />
      <PackageCard2 />
    </div>
  );
}

function SectionFeaturedHealthPackages() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Section - Featured Health Packages">
      <Container8 />
      <Container9 />
    </div>
  );
}

function Heading6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[32px] text-center whitespace-nowrap">
          <p className="leading-[40px]">Why Choose SubhOne Labs</p>
        </div>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[24px] relative shrink-0 w-[24.076px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 24.076 24" width="24.076">
        <g id="Container">
          <path d={svgPaths.p105576a0} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background8() {
  return (
    <div className="bg-[#bde9ff] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[64px]" data-name="Background">
      <Container38 />
    </div>
  );
}

function Margin2() {
  return (
    <div className="content-stretch flex flex-col h-[80px] items-start pb-[16px] relative shrink-0 w-[64px]" data-name="Margin">
      <Background8 />
    </div>
  );
}

function Heading7() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] text-center whitespace-nowrap">
        <p className="leading-[32px]">NABL Accredited Labs</p>
      </div>
    </div>
  );
}

function Heading4Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0" data-name="Heading 4:margin">
      <Heading7 />
    </div>
  );
}

function Container39() {
  return (
    <div className="content-stretch flex flex-col items-center pl-[12.14px] pr-[12.16px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[20px] mb-0">Testing in state-of-the-art, certified</p>
        <p className="leading-[20px]">laboratories ensuring 100% accuracy.</p>
      </div>
    </div>
  );
}

function Container37() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px relative" data-name="Container">
      <Margin2 />
      <Heading4Margin />
      <Container39 />
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[24px] relative shrink-0 w-[21.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 21.3333 24" width="21.3333">
        <g id="Container">
          <path d={svgPaths.p2587d500} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background9() {
  return (
    <div className="bg-[#bde9ff] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[64px]" data-name="Background">
      <Container41 />
    </div>
  );
}

function Margin3() {
  return (
    <div className="content-stretch flex flex-col h-[80px] items-start pb-[16px] relative shrink-0 w-[64px]" data-name="Margin">
      <Background9 />
    </div>
  );
}

function Heading8() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] text-center whitespace-nowrap">
        <p className="leading-[32px]">Free Home Collection</p>
      </div>
    </div>
  );
}

function Heading4Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0" data-name="Heading 4:margin">
      <Heading8 />
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex flex-col items-center px-[12.28px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[20px] mb-0">Trained professionals collect samples</p>
        <p className="leading-[20px]">safely from your home.</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px relative" data-name="Container">
      <Margin3 />
      <Heading4Margin1 />
      <Container42 />
    </div>
  );
}

function Container44() {
  return (
    <div className="h-[21.333px] relative shrink-0 w-[26.669px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="21.3333" preserveAspectRatio="none" viewBox="0 0 26.6689 21.3333" width="26.6689">
        <g id="Container">
          <path d={svgPaths.p1e0c4f60} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background10() {
  return (
    <div className="bg-[#bde9ff] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[64px]" data-name="Background">
      <Container44 />
    </div>
  );
}

function Margin4() {
  return (
    <div className="content-stretch flex flex-col h-[80px] items-start pb-[16px] relative shrink-0 w-[64px]" data-name="Margin">
      <Background10 />
    </div>
  );
}

function Heading9() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] text-center whitespace-nowrap">
        <p className="leading-[32px]">Fast Digital Reports</p>
      </div>
    </div>
  );
}

function Heading4Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0" data-name="Heading 4:margin">
      <Heading9 />
    </div>
  );
}

function Container45() {
  return (
    <div className="content-stretch flex flex-col items-center pl-[8.91px] pr-[8.92px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[20px] mb-0">Get smart, easy-to-understand reports</p>
        <p className="leading-[20px]">on your app within 24 hours.</p>
      </div>
    </div>
  );
}

function Container43() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px relative" data-name="Container">
      <Margin4 />
      <Heading4Margin2 />
      <Container45 />
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[26.667px] relative shrink-0 w-[21.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="26.6667" preserveAspectRatio="none" viewBox="0 0 21.3333 26.6667" width="21.3333">
        <g id="Container">
          <path d={svgPaths.p286fe780} fill="#007F9A" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background11() {
  return (
    <div className="bg-[#bde9ff] content-stretch flex items-center justify-center relative rounded-[9999px] shrink-0 size-[64px]" data-name="Background">
      <Container47 />
    </div>
  );
}

function Margin5() {
  return (
    <div className="content-stretch flex flex-col h-[80px] items-start pb-[16px] relative shrink-0 w-[64px]" data-name="Margin">
      <Background11 />
    </div>
  );
}

function Heading10() {
  return (
    <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[24px] text-center whitespace-nowrap">
        <p className="leading-[32px]">100% Secure Data</p>
      </div>
    </div>
  );
}

function Heading4Margin3() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0" data-name="Heading 4:margin">
      <Heading10 />
    </div>
  );
}

function Container48() {
  return (
    <div className="content-stretch flex flex-col items-center pl-[8.7px] pr-[8.72px] relative shrink-0" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[20px] mb-0">Your health records are encrypted and</p>
        <p className="leading-[20px]">kept strictly confidential.</p>
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-center min-w-px relative" data-name="Container">
      <Margin5 />
      <Heading4Margin3 />
      <Container48 />
    </div>
  );
}

function Container36() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[32px] items-start justify-center relative size-full">
        <Container37 />
        <Container40 />
        <Container43 />
        <Container46 />
      </div>
    </div>
  );
}

function SectionWhyChooseUs() {
  return (
    <div className="bg-[#f8fafb] relative rounded-[12px] shrink-0 w-full" data-name="Section - Why Choose Us">
      <div aria-hidden className="absolute border border-[#d5dcd3] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col gap-[32px] items-start p-[33px] relative size-full">
        <Heading6 />
        <Container36 />
      </div>
    </div>
  );
}

function SectionWhyChooseUsMargin() {
  return (
    <div className="content-stretch flex flex-col items-start py-[8px] relative shrink-0 w-full" data-name="Section - Why Choose Us:margin">
      <SectionWhyChooseUs />
    </div>
  );
}

function MainContent() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start left-0 max-w-[1280px] px-[40px] py-[32px] right-0 top-[65px]" data-name="Main Content">
      <HeroSection />
      <SectionCategoriesQuickLinksBentoGridStyle />
      <SectionFeaturedHealthPackages />
      <SectionWhyChooseUsMargin />
    </div>
  );
}

function Container51() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:ExtraBold',sans-serif] font-extrabold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[24px] w-full">
        <p className="leading-[32px]">SubhOne</p>
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px] mb-0">© 2024 SubhOne Wellness. All rights</p>
        <p className="leading-[20px]">reserved.</p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-name="Container">
      <Container51 />
      <Container52 />
    </div>
  );
}

function Heading11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 5">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] tracking-[0.7px] w-full">
        <p className="leading-[16px]">Company</p>
      </div>
    </div>
  );
}

function Heading5Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 5:margin">
      <Heading11 />
    </div>
  );
}

function Link5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">About Us</p>
      </div>
    </div>
  );
}

function Link6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Careers</p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px pb-[8px] relative" data-name="Container">
      <Heading5Margin />
      <Link5 />
      <Link6 />
    </div>
  );
}

function Heading12() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 5">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] tracking-[0.7px] w-full">
        <p className="leading-[16px]">Legal</p>
      </div>
    </div>
  );
}

function Heading5Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 5:margin">
      <Heading12 />
    </div>
  );
}

function Link7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Terms of Service</p>
      </div>
    </div>
  );
}

function Link8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Privacy Policy</p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px pb-[8px] relative" data-name="Container">
      <Heading5Margin1 />
      <Link7 />
      <Link8 />
    </div>
  );
}

function Heading13() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 5">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] tracking-[0.7px] w-full">
        <p className="leading-[16px]">Support</p>
      </div>
    </div>
  );
}

function Heading5Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 5:margin">
      <Heading13 />
    </div>
  );
}

function Link9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Contact Support</p>
      </div>
    </div>
  );
}

function Link10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">FAQs</p>
      </div>
    </div>
  );
}

function Container55() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px pb-[8px] relative" data-name="Container">
      <Heading5Margin2 />
      <Link9 />
      <Link10 />
    </div>
  );
}

function Container49() {
  return (
    <div className="max-w-[1280px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row justify-center max-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-start justify-center max-w-[inherit] px-[40px] py-[32px] relative size-full">
          <Container50 />
          <Container53 />
          <Container54 />
          <Container55 />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="absolute bg-[#dee4db] bottom-0 content-stretch flex flex-col items-start left-0 pt-px right-0" data-name="Footer">
      <div aria-hidden className="absolute border-[#bdcabc] border-solid border-t inset-0 pointer-events-none" />
      <Container49 />
    </div>
  );
}

function BrandLogo() {
  return (
    <div className="-translate-y-1/2 absolute content-stretch flex flex-col items-start left-[40px] top-1/2" data-name="Brand Logo">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:ExtraBold',sans-serif] font-extrabold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[24px] whitespace-nowrap">
        <p className="leading-[32px]">SubhOne</p>
      </div>
    </div>
  );
}

function Link11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Medicines</p>
      </div>
    </div>
  );
}

function Link12() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[2px] relative shrink-0" data-name="Link">
      <div aria-hidden className="absolute border-[#006a39] border-b-2 border-solid inset-0 pointer-events-none" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Lab Tests</p>
      </div>
    </div>
  );
}

function Link13() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Consult</p>
      </div>
    </div>
  );
}

function Link14() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Offers</p>
      </div>
    </div>
  );
}

function NavigationLinks() {
  return (
    <div className="-translate-y-1/2 absolute content-stretch flex gap-[24px] items-center left-[782.88px] top-1/2" data-name="Navigation Links">
      <Link11 />
      <Link12 />
      <Link13 />
      <Link14 />
    </div>
  );
}

function Container57() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[16px] w-full">
        <p className="leading-[normal]">Search for medicines, lab tests...</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f8fafb] flex-[1_0_0] h-[48px] min-w-px relative rounded-[8px]" data-name="Input">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-start pl-[40px] pr-[16px] py-[13.5px] relative size-full">
          <Container57 />
        </div>
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="absolute bottom-1/4 content-stretch flex flex-col items-start left-[12px] top-1/4" data-name="Container">
      <div className="relative shrink-0 size-[18px]" data-name="Icon">
        <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 18 18" width="18">
          <path d={svgPaths.p8a35e00} fill="#073B4C" id="Icon" />
        </svg>
      </div>
    </div>
  );
}

function SearchBarDesktop() {
  return (
    <div className="content-stretch flex items-start justify-center max-w-[576px] relative shrink-0 w-full" data-name="Search Bar (Desktop)">
      <Input />
      <Container58 />
    </div>
  );
}

function SearchBarDesktopMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[149.42px] max-w-[640px] px-[32px] right-[497.13px] top-[8px]" data-name="Search Bar (Desktop):margin">
      <SearchBarDesktop />
    </div>
  );
}

function Container59() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 16 20" width="16">
        <g id="Container">
          <path d={svgPaths.p1869180} fill="#006A39" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonLocation() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center pb-[15px] pt-[8px] px-[8px] relative rounded-[9999px] shrink-0" data-name="Button - Location">
      <Container59 />
    </div>
  );
}

function Container60() {
  return (
    <div className="h-[20px] relative shrink-0 w-[19.982px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 19.9815 20" width="19.9815">
        <g id="Container">
          <path d={svgPaths.pb5c2400} fill="#006A39" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background12() {
  return (
    <div className="absolute bg-[#0f9d58] content-stretch flex items-center justify-center right-[3.97px] rounded-[9999px] size-[16px] top-[4px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-center text-white whitespace-nowrap">
        <p className="leading-[15px]">2</p>
      </div>
    </div>
  );
}

function ButtonCart() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center pb-[15px] pt-[8px] px-[8px] relative rounded-[9999px] shrink-0" data-name="Button - Cart">
      <Container60 />
      <Background12 />
    </div>
  );
}

function Container61() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Container">
          <path d={svgPaths.p3de21300} fill="#006A39" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAccount() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center pb-[15px] pt-[8px] px-[8px] relative rounded-[9999px] shrink-0" data-name="Button - Account">
      <Container61 />
    </div>
  );
}

function TrailingIcons() {
  return (
    <div className="-translate-y-1/2 absolute content-stretch flex gap-[16px] items-center left-[1087.95px] top-1/2" data-name="Trailing Icons">
      <ButtonLocation />
      <ButtonCart />
      <ButtonAccount />
    </div>
  );
}

function Container56() {
  return (
    <div className="h-[64px] max-w-[1280px] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <BrandLogo />
        <NavigationLinks />
        <SearchBarDesktopMargin />
        <TrailingIcons />
      </div>
    </div>
  );
}

function HeaderTopNavigationBar() {
  return (
    <div className="absolute bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start left-0 pb-px right-0 top-0" data-name="Header - Top Navigation Bar">
      <div aria-hidden className="absolute border-[#bdcabc] border-b border-solid inset-0 pointer-events-none" />
      <Container56 />
    </div>
  );
}

export default function LabTestsCheckupsSubhOne() {
  return (
    <div className="relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(245, 251, 242) 0%, rgb(245, 251, 242) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Lab Tests & Checkups - SubhOne">
      <MainContent />
      <Footer />
      <HeaderTopNavigationBar />
    </div>
  );
}