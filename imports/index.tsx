import svgPaths from "./svg-5c4lp90afz";
import imgMainFeaturedCategory from "./12180d12bdb759cb4c1126433eb9617bcf5f0e37.png";
import imgVitamins from "./82fde6fb40fb3f0de4e0ae8e660633ef3205b656.png";
import imgAyurveda from "./5bf6c30bcdaa73c2f154fa0056e19083a2be7538.png";
import imgPremiumWheyProtein from "./d5d15fa3258f8a08d359a05ee21c14dc9b5772a4.png";
import imgOmega3FishOil from "./f2d5336de26350e80b974508f11f2c0dd8b163aa.png";
import imgMultivitamins from "./3c99917897bd535bf5e0599101f9a9230ad0a63d.png";
import imgAshwagandha from "./572e3e713ff3505ed972644010e32394fe453e53.png";
import imgSubhOneLogo from "./eda255af04a36a14d9768bb5538140ffaf8efc35.png";
import imgSubhOneLogo1 from "./d30158ca113a77b66ce6d5833aa493edc0c53d48.png";

function Background() {
  return (
    <div className="bg-[#0f9d58] content-stretch flex items-start px-[12px] py-[4px] relative rounded-[9999px] shrink-0" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-white tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Premium Sports Nutrition</p>
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[4px] relative shrink-0 w-full" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[32px] text-white w-full">
        <p className="leading-[40px]">Fuel Your Performance</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="content-stretch flex flex-col items-start max-w-[448px] pb-[8px] relative shrink-0 w-[448px]" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[16px] text-white whitespace-nowrap">
        <p className="leading-[24px] mb-0">Discover our clinical-grade whey proteins and pre-workout</p>
        <p className="leading-[24px]">formulas designed for peak results.</p>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex items-center justify-center px-[24px] py-[8px] relative rounded-[8px] shrink-0" data-name="Button">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Shop Proteins</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col gap-[8px] items-start left-0 p-[32px] right-0" data-name="Container">
      <Background />
      <Heading />
      <Container1 />
      <Button />
    </div>
  );
}

function MainFeaturedCategory() {
  return (
    <div className="bg-white col-[1/span_2] h-[400px] justify-self-stretch overflow-clip relative rounded-[16px] row-1 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0" data-name="Main Featured Category">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[107.89%] left-0 max-w-none top-[-3.95%] w-full" src={imgMainFeaturedCategory} />
      </div>
      <div className="absolute bg-gradient-to-t from-[rgba(7,59,76,0.8)] inset-0 to-[rgba(7,59,76,0)] via-1/2 via-[rgba(7,59,76,0.2)]" data-name="Gradient" />
      <Container />
    </div>
  );
}

function Heading1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[24px] text-white w-full">
        <p className="leading-[32px]">Daily Vitamins</p>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="relative shrink-0 size-[9.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="9.33333" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333" width="9.33333">
        <g id="Container">
          <path d={svgPaths.pce77c00} fill="#0F9D58" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Link() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f9d58] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Explore</p>
      </div>
      <Container3 />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start left-0 p-[16px] right-0" data-name="Container">
      <Heading1 />
      <Link />
    </div>
  );
}

function Vitamins() {
  return (
    <div className="bg-white h-[188px] overflow-clip relative rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Vitamins">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[111.3%] left-0 max-w-none top-[-5.65%] w-full" src={imgVitamins} />
      </div>
      <div className="absolute bg-gradient-to-t from-[rgba(7,59,76,0.7)] inset-0 to-[rgba(7,59,76,0)]" data-name="Gradient" />
      <Container2 />
    </div>
  );
}

function Heading2() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[24px] text-white w-full">
        <p className="leading-[32px]">Ayurvedic Blends</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="relative shrink-0 size-[9.333px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="9.33333" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333" width="9.33333">
        <g id="Container">
          <path d={svgPaths.pce77c00} fill="#0F9D58" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Link1() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#0f9d58] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Explore</p>
      </div>
      <Container5 />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute bottom-0 content-stretch flex flex-col items-start left-0 p-[16px] right-0" data-name="Container">
      <Heading2 />
      <Link1 />
    </div>
  );
}

function Ayurveda() {
  return (
    <div className="bg-white h-[188px] overflow-clip relative rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0 w-full" data-name="Ayurveda">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[111.3%] left-0 max-w-none top-[-5.65%] w-full" src={imgAyurveda} />
      </div>
      <div className="absolute bg-gradient-to-t from-[rgba(7,59,76,0.7)] inset-0 to-[rgba(7,59,76,0)]" data-name="Gradient" />
      <Container4 />
    </div>
  );
}

function SecondaryCategoriesStack() {
  return (
    <div className="col-3 content-stretch flex flex-col gap-[24px] items-start justify-self-stretch relative row-1 self-start shrink-0" data-name="Secondary Categories Stack">
      <Vitamins />
      <Ayurveda />
    </div>
  );
}

function HeroSectionBentoGrid() {
  return (
    <div className="gap-x-[24px] gap-y-[24px] grid grid-cols-[repeat(3,minmax(0,1fr))] grid-rows-[_400px] relative shrink-0 w-full" data-name="Hero Section / Bento Grid">
      <MainFeaturedCategory />
      <SecondaryCategoriesStack />
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-[#008649] content-stretch flex flex-col items-center justify-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#008649] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#f6fff4] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">All Supplements</p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Protein</p>
      </div>
    </div>
  );
}

function ButtonMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[12px] relative shrink-0" data-name="Button:margin">
      <Button2 />
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">{`Vitamins & Minerals`}</p>
      </div>
    </div>
  );
}

function ButtonMargin1() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[12px] relative shrink-0" data-name="Button:margin">
      <Button3 />
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">{`Omega & Fish Oil`}</p>
      </div>
    </div>
  );
}

function ButtonMargin2() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[12px] relative shrink-0" data-name="Button:margin">
      <Button4 />
    </div>
  );
}

function Button5() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Immunity Boosters</p>
      </div>
    </div>
  );
}

function ButtonMargin3() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[12px] relative shrink-0" data-name="Button:margin">
      <Button5 />
    </div>
  );
}

function Button6() {
  return (
    <div className="bg-white content-stretch flex flex-col items-center justify-center px-[17px] py-[9px] relative rounded-[9999px] shrink-0" data-name="Button">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[9999px]" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#073b4c] text-[14px] text-center tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Weight Management</p>
      </div>
    </div>
  );
}

function ButtonMargin4() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[12px] relative shrink-0" data-name="Button:margin">
      <Button6 />
    </div>
  );
}

function Container6() {
  return (
    <div className="content-stretch flex items-start relative shrink-0" data-name="Container">
      <Button1 />
      <ButtonMargin />
      <ButtonMargin1 />
      <ButtonMargin2 />
      <ButtonMargin3 />
      <ButtonMargin4 />
    </div>
  );
}

function SectionCategoryChips() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-auto pb-[8px] relative shrink-0 w-full" data-name="Section - Category Chips">
      <Container6 />
    </div>
  );
}

function Heading3() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 2">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[32px] whitespace-nowrap">
        <p className="leading-[40px]">Best Sellers</p>
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[16px] whitespace-nowrap">
        <p className="leading-[24px]">Highly rated clinical-grade formulations.</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0" data-name="Container">
      <Heading3 />
      <Container9 />
    </div>
  );
}

function Container10() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="16" preserveAspectRatio="none" viewBox="0 0 16 16" width="16">
        <g id="Container">
          <path d={svgPaths.p1a406200} fill="#006A39" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Link2() {
  return (
    <div className="content-stretch flex gap-[3.99px] items-center relative shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">View All</p>
      </div>
      <Container10 />
    </div>
  );
}

function Container7() {
  return (
    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-name="Container">
      <Container8 />
      <Link2 />
    </div>
  );
}

function PremiumWheyProtein() {
  return (
    <div className="aspect-[248/160] h-full max-w-[248px] mix-blend-multiply relative shrink-0" data-name="Premium Whey Protein">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[84.46%] left-0 max-w-none top-[7.77%] w-full" src={imgPremiumWheyProtein} />
      </div>
    </div>
  );
}

function Background1() {
  return (
    <div className="bg-[#f8fafb] content-stretch flex h-[160px] items-center justify-center overflow-clip relative rounded-[8px] shrink-0 w-full" data-name="Background">
      <PremiumWheyProtein />
    </div>
  );
}

function Margin() {
  return (
    <div className="h-[176px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[16px] relative size-full">
        <Background1 />
      </div>
    </div>
  );
}

function Container13() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f9d58] text-[12px] tracking-[0.6px] uppercase w-full">
        <p className="leading-[16px]">OPTIMUM NUTRITION</p>
      </div>
    </div>
  );
}

function Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[4px] relative shrink-0 w-full" data-name="Margin">
      <Container13 />
    </div>
  );
}

function Heading4() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[16px] w-full">
        <p className="leading-[22px] mb-0">Gold Standard 100% Whey</p>
        <p className="leading-[22px]">Protein Isolate</p>
      </div>
    </div>
  );
}

function Heading3Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 3:margin">
      <Heading4 />
    </div>
  );
}

function Container15() {
  return (
    <div className="h-[11.083px] relative shrink-0 w-[11.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.0833" preserveAspectRatio="none" viewBox="0 0 11.6667 11.0833" width="11.6667">
        <g id="Container">
          <path d={svgPaths.p21398000} fill="#FFB703" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin3() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">4.8</p>
      </div>
    </div>
  );
}

function Margin4() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">(1.2k)</p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Container15 />
      <Margin3 />
      <Margin4 />
    </div>
  );
}

function Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Margin">
      <Container14 />
    </div>
  );
}

function Container16() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[20px] whitespace-nowrap">
          <p className="leading-[24px]">₹3,499</p>
        </div>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[21px] relative shrink-0 w-[20.7px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="21" preserveAspectRatio="none" viewBox="0 0 20.7 21" width="20.7">
        <g id="Container">
          <path d={svgPaths.p7fb5300} fill="white" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCart() {
  return (
    <div className="bg-[#006a39] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0" data-name="Button - Add to Cart">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[8px] relative size-full">
        <Container17 />
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="content-stretch flex items-center justify-between pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[#e3eae1] border-solid border-t inset-0 pointer-events-none" />
      <Container16 />
      <ButtonAddToCart />
    </div>
  );
}

function Container12() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between relative size-full">
        <Margin1 />
        <Heading3Margin />
        <Margin2 />
        <HorizontalBorder />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="h-[18.35px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18.35" preserveAspectRatio="none" viewBox="0 0 20 18.35" width="20">
        <g id="Container">
          <path d={svgPaths.p279a9400} fill="#6D7A6F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] right-[13px] rounded-[9999px] top-[13px]" data-name="Button - Add to Wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[11px] pt-[4px] px-[4px] relative size-full">
        <Container18 />
      </div>
    </div>
  );
}

function ProductCard() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Product Card 1">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col items-start p-[17px] relative size-full">
        <Margin />
        <Container12 />
        <ButtonAddToWishlist />
      </div>
    </div>
  );
}

function Omega3FishOil() {
  return (
    <div className="aspect-[248/160] h-full max-w-[248px] mix-blend-multiply relative shrink-0" data-name="Omega 3 Fish Oil">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[84.46%] left-0 max-w-none top-[7.77%] w-full" src={imgOmega3FishOil} />
      </div>
    </div>
  );
}

function Background2() {
  return (
    <div className="bg-[#f8fafb] content-stretch flex h-[160px] items-center justify-center overflow-clip relative rounded-[8px] shrink-0 w-full" data-name="Background">
      <Omega3FishOil />
    </div>
  );
}

function Margin5() {
  return (
    <div className="h-[176px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[16px] relative size-full">
        <Background2 />
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f9d58] text-[12px] tracking-[0.6px] uppercase w-full">
        <p className="leading-[16px]">{`NATURE'S BOUNTY`}</p>
      </div>
    </div>
  );
}

function Margin6() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[4px] relative shrink-0 w-full" data-name="Margin">
      <Container20 />
    </div>
  );
}

function Heading5() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[16px] w-full">
        <p className="leading-[22px] mb-0">Triple Strength Omega-3 Fish Oil</p>
        <p className="leading-[22px]">1400mg</p>
      </div>
    </div>
  );
}

function Heading3Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 3:margin">
      <Heading5 />
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[11.083px] relative shrink-0 w-[11.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.0833" preserveAspectRatio="none" viewBox="0 0 11.6667 11.0833" width="11.6667">
        <g id="Container">
          <path d={svgPaths.p21398000} fill="#FFB703" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin8() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">4.6</p>
      </div>
    </div>
  );
}

function Margin9() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">(850)</p>
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Container22 />
      <Margin8 />
      <Margin9 />
    </div>
  );
}

function Margin7() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Margin">
      <Container21 />
    </div>
  );
}

function Container23() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[20px] whitespace-nowrap">
          <p className="leading-[24px]">₹1,249</p>
        </div>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="h-[21px] relative shrink-0 w-[20.7px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="21" preserveAspectRatio="none" viewBox="0 0 20.7 21" width="20.7">
        <g id="Container">
          <path d={svgPaths.p7fb5300} fill="white" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCart1() {
  return (
    <div className="bg-[#006a39] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0" data-name="Button - Add to Cart">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[8px] relative size-full">
        <Container24 />
      </div>
    </div>
  );
}

function HorizontalBorder1() {
  return (
    <div className="content-stretch flex items-center justify-between pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[#e3eae1] border-solid border-t inset-0 pointer-events-none" />
      <Container23 />
      <ButtonAddToCart1 />
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between relative size-full">
        <Margin6 />
        <Heading3Margin1 />
        <Margin7 />
        <HorizontalBorder1 />
      </div>
    </div>
  );
}

function Container25() {
  return (
    <div className="h-[18.35px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18.35" preserveAspectRatio="none" viewBox="0 0 20 18.35" width="20">
        <g id="Container">
          <path d={svgPaths.p279a9400} fill="#6D7A6F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist1() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] right-[13px] rounded-[9999px] top-[13px]" data-name="Button - Add to Wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[11px] pt-[4px] px-[4px] relative size-full">
        <Container25 />
      </div>
    </div>
  );
}

function ProductCard1() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Product Card 2">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col items-start p-[17px] relative size-full">
        <Margin5 />
        <Container19 />
        <ButtonAddToWishlist1 />
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="h-[18.35px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18.35" preserveAspectRatio="none" viewBox="0 0 20 18.35" width="20">
        <g id="Container">
          <path d={svgPaths.p279a9400} fill="#6D7A6F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist2() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] right-[13px] rounded-[9999px] top-[13px] z-[3]" data-name="Button - Add to Wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[11px] pt-[4px] px-[4px] relative size-full">
        <Container26 />
      </div>
    </div>
  );
}

function Background4() {
  return (
    <div className="absolute bg-[#ffb703] content-stretch flex flex-col items-start left-[8px] px-[8px] py-[4px] rounded-[2px] top-[8px]" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[10px] tracking-[0.25px] uppercase whitespace-nowrap">
        <p className="leading-[15px]">BEST VALUE</p>
      </div>
    </div>
  );
}

function Multivitamins() {
  return (
    <div className="aspect-[248/160] h-full max-w-[248px] mix-blend-multiply relative shrink-0" data-name="Multivitamins">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[84.46%] left-0 max-w-none top-[7.77%] w-full" src={imgMultivitamins} />
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div className="bg-[#f8fafb] content-stretch flex h-[160px] items-center justify-center overflow-clip relative rounded-[8px] shrink-0 w-full" data-name="Background">
      <Background4 />
      <Multivitamins />
    </div>
  );
}

function Margin10() {
  return (
    <div className="h-[176px] relative shrink-0 w-full z-[2]" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[16px] relative size-full">
        <Background3 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f9d58] text-[12px] tracking-[0.6px] uppercase w-full">
        <p className="leading-[16px]">CENTRUM</p>
      </div>
    </div>
  );
}

function Margin11() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[4px] relative shrink-0 w-full" data-name="Margin">
      <Container28 />
    </div>
  );
}

function Heading6() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[16px] w-full">
        <p className="leading-[22px] mb-0">{`Adult Multivitamin &`}</p>
        <p className="leading-[22px]">Multimineral Supplement</p>
      </div>
    </div>
  );
}

function Heading3Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 3:margin">
      <Heading6 />
    </div>
  );
}

function Container30() {
  return (
    <div className="h-[11.083px] relative shrink-0 w-[11.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.0833" preserveAspectRatio="none" viewBox="0 0 11.6667 11.0833" width="11.6667">
        <g id="Container">
          <path d={svgPaths.p21398000} fill="#FFB703" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin13() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">4.9</p>
      </div>
    </div>
  );
}

function Margin14() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">(2.1k)</p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Container30 />
      <Margin13 />
      <Margin14 />
    </div>
  );
}

function Margin12() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Margin">
      <Container29 />
    </div>
  );
}

function Container31() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[20px] whitespace-nowrap">
          <p className="leading-[24px]">₹999</p>
        </div>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="h-[21px] relative shrink-0 w-[20.7px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="21" preserveAspectRatio="none" viewBox="0 0 20.7 21" width="20.7">
        <g id="Container">
          <path d={svgPaths.p7fb5300} fill="white" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCart2() {
  return (
    <div className="bg-[#006a39] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0" data-name="Button - Add to Cart">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[8px] relative size-full">
        <Container32 />
      </div>
    </div>
  );
}

function HorizontalBorder2() {
  return (
    <div className="content-stretch flex items-center justify-between pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[#e3eae1] border-solid border-t inset-0 pointer-events-none" />
      <Container31 />
      <ButtonAddToCart2 />
    </div>
  );
}

function Container27() {
  return (
    <div className="relative shrink-0 w-full z-[1]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between relative size-full">
        <Margin11 />
        <Heading3Margin2 />
        <Margin12 />
        <HorizontalBorder2 />
      </div>
    </div>
  );
}

function ProductCard2() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Product Card 3">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col isolate items-start p-[17px] relative size-full">
        <ButtonAddToWishlist2 />
        <Margin10 />
        <Container27 />
      </div>
    </div>
  );
}

function Ashwagandha() {
  return (
    <div className="aspect-[248/160] h-full max-w-[248px] mix-blend-multiply relative shrink-0" data-name="Ashwagandha">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[84.46%] left-0 max-w-none top-[7.77%] w-full" src={imgAshwagandha} />
      </div>
    </div>
  );
}

function Background5() {
  return (
    <div className="bg-[#f8fafb] content-stretch flex h-[160px] items-center justify-center overflow-clip relative rounded-[8px] shrink-0 w-full" data-name="Background">
      <Ashwagandha />
    </div>
  );
}

function Margin15() {
  return (
    <div className="h-[176px] relative shrink-0 w-full" data-name="Margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[16px] relative size-full">
        <Background5 />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f9d58] text-[12px] tracking-[0.6px] uppercase w-full">
        <p className="leading-[16px]">HIMALAYA</p>
      </div>
    </div>
  );
}

function Margin16() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[4px] relative shrink-0 w-full" data-name="Margin">
      <Container34 />
    </div>
  );
}

function Heading7() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="Heading 3">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[16px] w-full">
        <p className="leading-[22px] mb-0">Organic Ashwagandha Root</p>
        <p className="leading-[22px]">Extract</p>
      </div>
    </div>
  );
}

function Heading3Margin3() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 3:margin">
      <Heading7 />
    </div>
  );
}

function Container36() {
  return (
    <div className="h-[11.083px] relative shrink-0 w-[11.667px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="11.0833" preserveAspectRatio="none" viewBox="0 0 11.6667 11.0833" width="11.6667">
        <g id="Container">
          <path d={svgPaths.p21398000} fill="#FFB703" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Margin18() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">4.7</p>
      </div>
    </div>
  );
}

function Margin19() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[4px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6d7a6f] text-[14px] whitespace-nowrap">
        <p className="leading-[20px]">(420)</p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Container">
      <Container36 />
      <Margin18 />
      <Margin19 />
    </div>
  );
}

function Margin17() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Margin">
      <Container35 />
    </div>
  );
}

function Container37() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <div className="[word-break:break-word] flex flex-col font-['Manrope:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[20px] whitespace-nowrap">
          <p className="leading-[24px]">₹649</p>
        </div>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="h-[21px] relative shrink-0 w-[20.7px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="21" preserveAspectRatio="none" viewBox="0 0 20.7 21" width="20.7">
        <g id="Container">
          <path d={svgPaths.p7fb5300} fill="white" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToCart3() {
  return (
    <div className="bg-[#006a39] drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] relative rounded-[8px] shrink-0" data-name="Button - Add to Cart">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center p-[8px] relative size-full">
        <Container38 />
      </div>
    </div>
  );
}

function HorizontalBorder3() {
  return (
    <div className="content-stretch flex items-center justify-between pt-[13px] relative shrink-0 w-full" data-name="HorizontalBorder">
      <div aria-hidden className="absolute border-[#e3eae1] border-solid border-t inset-0 pointer-events-none" />
      <Container37 />
      <ButtonAddToCart3 />
    </div>
  );
}

function Container33() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start justify-between relative size-full">
        <Margin16 />
        <Heading3Margin3 />
        <Margin17 />
        <HorizontalBorder3 />
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="h-[18.35px] relative shrink-0 w-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18.35" preserveAspectRatio="none" viewBox="0 0 20 18.35" width="20">
        <g id="Container">
          <path d={svgPaths.p279a9400} fill="#6D7A6F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAddToWishlist3() {
  return (
    <div className="absolute bg-[rgba(255,255,255,0.8)] right-[13px] rounded-[9999px] top-[13px]" data-name="Button - Add to Wishlist">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center justify-center pb-[11px] pt-[4px] px-[4px] relative size-full">
        <Container39 />
      </div>
    </div>
  );
}

function ProductCard4HiddenOnSmallMobileVisibleMd() {
  return (
    <div className="bg-white flex-[1_0_0] min-w-px relative rounded-[12px]" data-name="Product Card 4 (Hidden on small mobile, visible md+)">
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col items-start p-[17px] relative size-full">
        <Margin15 />
        <Container33 />
        <ButtonAddToWishlist3 />
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="content-stretch flex gap-[24px] items-start justify-center relative shrink-0 w-full" data-name="Container">
      <ProductCard />
      <ProductCard1 />
      <ProductCard2 />
      <ProductCard4HiddenOnSmallMobileVisibleMd />
    </div>
  );
}

function SectionBestSellers() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Section - Best Sellers">
      <Container7 />
      <Container11 />
    </div>
  );
}

function MainContent() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[32px] items-start left-0 max-w-[1280px] px-[40px] py-[32px] right-0 top-[81px]" data-name="Main Content">
      <HeroSectionBentoGrid />
      <SectionCategoryChips />
      <SectionBestSellers />
    </div>
  );
}

function SubhOneLogo() {
  return (
    <div className="h-[32px] max-w-[282px] opacity-70 relative shrink-0 w-[58.72px]" data-name="SubhOne Logo">
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 overflow-hidden">
          <img alt="" className="absolute h-[99.99%] left-0 max-w-none top-0 w-full" src={imgSubhOneLogo} />
        </div>
        <div className="absolute bg-white inset-0 mix-blend-saturation" />
      </div>
    </div>
  );
}

function Margin20() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[8px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:ExtraBold',sans-serif] font-extrabold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[24px] whitespace-nowrap">
        <p className="leading-[32px]">SubhOne</p>
      </div>
    </div>
  );
}

function Link3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Link">
      <SubhOneLogo />
      <Margin20 />
    </div>
  );
}

function Container41() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px] mb-0">Your trusted partner in holistic wellness and</p>
        <p className="leading-[20px]">clinical care.</p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px] mb-0">© 2024 SubhOne Wellness. All rights</p>
        <p className="leading-[20px]">reserved.</p>
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start relative size-full">
        <Link3 />
        <Container41 />
        <Container42 />
      </div>
    </div>
  );
}

function Heading8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] tracking-[0.7px] w-full">
        <p className="leading-[16px]">Company</p>
      </div>
    </div>
  );
}

function Heading4Margin() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 4:margin">
      <Heading8 />
    </div>
  );
}

function Link4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">About Us</p>
      </div>
    </div>
  );
}

function LinkMargin() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link4 />
    </div>
  );
}

function Link5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Careers</p>
      </div>
    </div>
  );
}

function LinkMargin1() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link5 />
    </div>
  );
}

function Link6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Press</p>
      </div>
    </div>
  );
}

function LinkMargin2() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link6 />
    </div>
  );
}

function Container43() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[36px] relative size-full">
        <Heading4Margin />
        <LinkMargin />
        <LinkMargin1 />
        <LinkMargin2 />
      </div>
    </div>
  );
}

function Heading9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] tracking-[0.7px] w-full">
        <p className="leading-[16px]">Support</p>
      </div>
    </div>
  );
}

function Heading4Margin1() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 4:margin">
      <Heading9 />
    </div>
  );
}

function Link7() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Contact Support</p>
      </div>
    </div>
  );
}

function LinkMargin3() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link7 />
    </div>
  );
}

function Link8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">{`Shipping & Returns`}</p>
      </div>
    </div>
  );
}

function LinkMargin4() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link8 />
    </div>
  );
}

function Link9() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">FAQs</p>
      </div>
    </div>
  );
}

function LinkMargin5() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link9 />
    </div>
  );
}

function Container44() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[36px] relative size-full">
        <Heading4Margin1 />
        <LinkMargin3 />
        <LinkMargin4 />
        <LinkMargin5 />
      </div>
    </div>
  );
}

function Heading10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Heading 4">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#171d18] text-[14px] tracking-[0.7px] w-full">
        <p className="leading-[16px]">Legal</p>
      </div>
    </div>
  );
}

function Heading4Margin2() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[8px] relative shrink-0 w-full" data-name="Heading 4:margin">
      <Heading10 />
    </div>
  );
}

function Link10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Terms of Service</p>
      </div>
    </div>
  );
}

function LinkMargin6() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link10 />
    </div>
  );
}

function Link11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] w-full">
        <p className="leading-[20px]">Privacy Policy</p>
      </div>
    </div>
  );
}

function LinkMargin7() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0 w-full" data-name="Link:margin">
      <Link11 />
    </div>
  );
}

function Container45() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[64px] relative size-full">
        <Heading4Margin2 />
        <LinkMargin6 />
        <LinkMargin7 />
      </div>
    </div>
  );
}

function FooterDesktop() {
  return (
    <div className="absolute bg-[#dee4db] content-stretch flex gap-[24px] items-start justify-center left-0 max-w-[1280px] pb-[32px] pt-[33px] px-[40px] right-0 top-[1138px]" data-name="Footer (Desktop)">
      <div aria-hidden className="absolute border-[#bdcabc] border-solid border-t inset-0 pointer-events-none" />
      <Container40 />
      <Container43 />
      <Container44 />
      <Container45 />
    </div>
  );
}

function SubhOneLogo1() {
  return (
    <div className="h-[40px] relative shrink-0 w-[73.39px]" data-name="SubhOne Logo">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[99.98%] left-0 max-w-none top-[0.01%] w-full" src={imgSubhOneLogo1} />
      </div>
    </div>
  );
}

function Margin21() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[8px] relative shrink-0" data-name="Margin">
      <div className="[word-break:break-word] flex flex-col font-['Manrope:ExtraBold',sans-serif] font-extrabold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[24px] whitespace-nowrap">
        <p className="leading-[32px]">SubhOne</p>
      </div>
    </div>
  );
}

function LogoLink() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Logo → Link">
      <SubhOneLogo1 />
      <Margin21 />
    </div>
  );
}

function Container48() {
  return (
    <div className="flex-[1_0_0] min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#6b7280] text-[16px] w-full">
          <p className="leading-[normal]">Search for medicines, vitamins...</p>
        </div>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#eff6ec] relative rounded-[9999px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-start justify-center pb-[15px] pl-[41px] pr-[17px] pt-[14px] relative size-full">
          <Container48 />
        </div>
      </div>
      <div aria-hidden className="absolute border border-[#bdcabc] border-solid inset-0 pointer-events-none rounded-[9999px]" />
    </div>
  );
}

function Container50() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="18" preserveAspectRatio="none" viewBox="0 0 18 18" width="18">
        <g id="Container">
          <path d={svgPaths.p8a35e00} fill="#6D7A6F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Container49() {
  return (
    <div className="absolute bottom-0 content-stretch flex items-center left-0 pl-[12px] top-0" data-name="Container">
      <Container50 />
    </div>
  );
}

function Container47() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Container">
      <Input />
      <Container49 />
    </div>
  );
}

function SearchBar() {
  return (
    <div className="flex-[1_0_0] max-w-[672px] min-w-px relative" data-name="Search Bar">
      <div className="content-stretch flex flex-col items-start max-w-[inherit] px-[32px] relative size-full">
        <Container47 />
      </div>
    </div>
  );
}

function Link12() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Link">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Medicines</p>
      </div>
    </div>
  );
}

function LinkMargin8() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[24px] relative shrink-0" data-name="Link:margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Lab Tests</p>
      </div>
    </div>
  );
}

function LinkMargin9() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[24px] relative shrink-0" data-name="Link:margin">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#3e4a3f] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Consult</p>
      </div>
    </div>
  );
}

function Link13() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[6px] relative shrink-0" data-name="Link">
      <div aria-hidden className="absolute border-[#006a39] border-b-2 border-solid inset-0 pointer-events-none" />
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[#006a39] text-[14px] tracking-[0.7px] whitespace-nowrap">
        <p className="leading-[16px]">Offers</p>
      </div>
    </div>
  );
}

function LinkMargin10() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[24px] relative shrink-0" data-name="Link:margin">
      <Link13 />
    </div>
  );
}

function Nav() {
  return (
    <div className="content-stretch flex items-center mr-[-0.01px] relative shrink-0" data-name="Nav">
      <Link12 />
      <LinkMargin8 />
      <LinkMargin9 />
      <LinkMargin10 />
    </div>
  );
}

function Container51() {
  return (
    <div className="h-[20px] relative shrink-0 w-[16px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 16 20" width="16">
        <g id="Container">
          <path d={svgPaths.p1869180} fill="#3E4A3F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonLocation() {
  return (
    <div className="-translate-y-1/2 absolute content-stretch flex flex-col items-center justify-center left-[25px] pb-[15px] pt-[8px] px-[8px] rounded-[9999px] top-1/2" data-name="Button - Location">
      <Container51 />
    </div>
  );
}

function Container52() {
  return (
    <div className="relative shrink-0 size-[20px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 20 20" width="20">
        <g id="Container">
          <path d={svgPaths.p3de21300} fill="#3E4A3F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function ButtonAccount() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center pb-[15px] pt-[8px] px-[8px] relative rounded-[9999px] shrink-0" data-name="Button - Account">
      <Container52 />
    </div>
  );
}

function ButtonAccountMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[121.03px] pl-[16px] top-0" data-name="Button - Account:margin">
      <ButtonAccount />
    </div>
  );
}

function Container53() {
  return (
    <div className="h-[20px] relative shrink-0 w-[19.982px]" data-name="Container">
      <svg className="absolute block inset-0 size-full" fill="none" height="20" preserveAspectRatio="none" viewBox="0 0 19.9815 20" width="19.9815">
        <g id="Container">
          <path d={svgPaths.pb5c2400} fill="#3E4A3F" id="Icon" />
        </g>
      </svg>
    </div>
  );
}

function Background6() {
  return (
    <div className="absolute bg-[#0f9d58] content-stretch flex items-center justify-center right-[-0.03px] rounded-[9999px] size-[16px] top-0" data-name="Background">
      <div className="[word-break:break-word] flex flex-col font-['Hanken_Grotesk:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[10px] text-center text-white whitespace-nowrap">
        <p className="leading-[15px]">2</p>
      </div>
    </div>
  );
}

function ButtonCart() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center pb-[15px] pt-[8px] px-[8px] relative rounded-[9999px] shrink-0" data-name="Button - Cart">
      <Container53 />
      <Background6 />
    </div>
  );
}

function ButtonCartMargin() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[65.02px] pl-[16px] top-0" data-name="Button - Cart:margin">
      <ButtonCart />
    </div>
  );
}

function VerticalBorder() {
  return (
    <div className="h-[47px] relative shrink-0 w-[177.05px]" data-name="VerticalBorder">
      <div aria-hidden className="absolute border-[#bdcabc] border-l border-solid inset-0 pointer-events-none" />
      <ButtonLocation />
      <ButtonAccountMargin />
      <ButtonCartMargin />
    </div>
  );
}

function Margin22() {
  return (
    <div className="content-stretch flex flex-col items-start pl-[32px] relative shrink-0" data-name="Margin">
      <VerticalBorder />
    </div>
  );
}

function NavigationLinksIcons() {
  return (
    <div className="content-stretch flex items-center relative shrink-0" data-name="Navigation Links & Icons">
      <Nav />
      <Margin22 />
    </div>
  );
}

function Container46() {
  return (
    <div className="h-[80px] max-w-[1280px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center max-w-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between max-w-[inherit] pl-[40px] pr-[39.99px] py-[8px] relative size-full">
          <LogoLink />
          <SearchBar />
          <NavigationLinksIcons />
        </div>
      </div>
    </div>
  );
}

function HeaderTopNavBar() {
  return (
    <div className="absolute bg-white content-stretch drop-shadow-[0px_1px_1px_rgba(0,0,0,0.05)] flex flex-col items-start left-0 pb-px right-0 top-0" data-name="Header - TopNavBar">
      <div aria-hidden className="absolute border-[#bdcabc] border-b border-solid inset-0 pointer-events-none" />
      <Container46 />
    </div>
  );
}

export default function HealthSupplementsSubhOne() {
  return (
    <div className="relative size-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(245, 251, 242) 0%, rgb(245, 251, 242) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }} data-name="Health Supplements - SubhOne">
      <MainContent />
      <FooterDesktop />
      <HeaderTopNavBar />
    </div>
  );
}