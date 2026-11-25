import { BannerStrip } from "@/components/home/banner-strip";
import { HeroSection } from "@/components/home/hero-section";
import { TrustBar } from "@/components/home/trust-bar";
import { BestSellers } from "@/components/home/best-sellers";
import { StoriesSection } from "@/components/home/stories-section";
import { IngredientsSection } from "@/components/home/ingredients-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { ComparisonSection } from "@/components/home/comparison-section";
import { FloCircleSection } from "@/components/home/flo-circle-section";
import { LoveScoreSection } from "@/components/home/love-score-section";
import { LoveSavingsPopup } from "@/components/home/love-savings-popup";
import { FaqSection } from "@/components/home/faq-section";
import { BlogTeaser } from "@/components/blog/blog-teaser";
import { SiteFooter } from "@/components/home/site-footer";
import {
  getActiveBanners,
  getActiveFaqs,
  getActiveTestimonials,
  getLatestPosts,
} from "@/lib/cms";
import { getActiveProducts } from "@/lib/products";
import { getStoriesVideos } from "@/lib/videos";

export default async function HomePage() {
  const [storyVideos, faqs, testimonials, products, banners, latestPosts] = await Promise.all([
    getStoriesVideos(),
    getActiveFaqs(),
    getActiveTestimonials(),
    getActiveProducts(),
    getActiveBanners("homepage_top"),
    getLatestPosts(3),
  ]);

  return (
    <>
      <LoveSavingsPopup />
      <BannerStrip banners={banners} />
      <HeroSection />
      <TrustBar tone="maroon" yellowAlt>
        Loved by 36k+ Women across India • Source of Protein, Fiber, Iron, Magnesium and Zinc •
        With Dark Chocolate • myo-inositol
      </TrustBar>
      <BestSellers products={products} />
      <TrustBar tone="whiteBrown">
        nutritionist Reviewed • Made with Familiar Ingredients •
        no exaggerated claims
      </TrustBar>
      <div id="stories" className="scroll-mt-[var(--flo-header-offset)]">
        <StoriesSection videos={storyVideos} />
      </div>
      <IngredientsSection />
      <TestimonialsSection testimonials={testimonials} />
      <ComparisonSection />
      <FloCircleSection />
      <LoveScoreSection />
      <BlogTeaser posts={latestPosts} />
      <FaqSection faqs={faqs} />
      <SiteFooter />
    </>
  );
}
