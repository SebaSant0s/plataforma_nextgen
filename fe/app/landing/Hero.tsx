import { Button } from '@/components/ui/button';
import { LogIn, Github } from "lucide-react";

const Hero = () => {
  return (
    <section className='grow'>
      <div className='container mx-auto px-4 my-24 max-w-screen-lg'>
        <div className="max-w-sm mb-8">
          <h1 className="mb-5 text-5xl font-extrabold leading-tight">Realtime Chat & Video App</h1>
          <p className="text-gray-500 text-lg">
            Our easy-to-use project has everything you need to build a fun and interactive chat experience.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="default">
            <LogIn className="w-4 h-4 mr-2" />
            Sign in</Button>
          <Button variant="secondary">
            <Github className="w-4 h-4 mr-2" />
            GitHub</Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;