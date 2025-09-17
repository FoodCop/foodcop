import { FuzoCard } from "../global/FuzoCard";

export function FoodStoryboardSection() {
  return (
    <section
      className="py-20 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1552166539-2ec8888dd801?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZmxhdCUyMGxheSUyMGNvbG9yZnVsJTIwZGlzaGVzfGVufDF8fHx8MTc1NjgzMjk1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center">
          <FuzoCard
            background="dark"
            className="max-w-2xl text-center shadow-2xl"
          >
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Food Storyboard
              </h2>
              <p className="text-lg text-white/90">
                Create visual stories of your culinary journey. Document your
                food adventures across different cities and cultures, building a
                beautiful timeline of flavors and memories.
              </p>
            </div>
          </FuzoCard>
        </div>
      </div>
    </section>
  );
}
