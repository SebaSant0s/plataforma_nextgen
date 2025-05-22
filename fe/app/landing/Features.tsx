import Feature from "@/components/feature";

const Features = () => {
  return (
    <section className="container mx-auto max-w-screen-lg px-4 my-24">
      <h2 className="mb-6 text-2xl font-bold">Features</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Feature title="Realtime Chat" description="Chat App that includes sending invites, authentication and managing communication." />
        <Feature title="Next.js" description="Built with Next.js 14, following the best practices. Easily customizable both server and client components combining the power of SSR with a seamless UI" />
        <Feature title="TypeScript" description="Components and functions are typed with TypeScript." />
        <Feature title="Styling & UI" description="Styled with Tailwind CSS and using Shadcn UI components" />
        <Feature title="Authentication" description="Authentication using Clerk that provides comprehensible admin dashboard." />
        <Feature title="RLT Communication" description="Implemented Web Socket Connections to create a real-time communication between users integrating Stream API" />
      </div>
    </section>
  );
}

export default Features;