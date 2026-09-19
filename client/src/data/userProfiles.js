export const DEMO_ACCOUNTS = {
  agent: {
    id: "usr_agent_001",
    name: "Vikram Malhotra",
    email: "vikram@sothebysrealty.in",
    role: "agent",
    agency: "Sotheby's International Realty Mumbai",
    reraNumber: "A51900018420",
    phone: "+91 98200 12345",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"
  },
  buyer: {
    id: "usr_buyer_001",
    name: "Ananya Sharma",
    email: "ananya.sharma@gmail.com",
    role: "buyer",
    targetCity: "Bengaluru / Mumbai",
    budgetRange: "₹5 Cr - ₹15 Cr",
    phone: "+91 98450 67890",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80"
  }
};

export const AVATAR_PRESETS = [
  { id: 'av1', label: 'Vikram (Suited)', role: 'agent', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80' },
  { id: 'av2', label: 'Priya (Executive)', role: 'agent', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80' },
  { id: 'av3', label: 'Rajesh (Senior Broker)', role: 'agent', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80' },
  { id: 'av4', label: 'Ananya (Modern Exec)', role: 'buyer', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80' },
  { id: 'av5', label: 'Rohan (Tech Leader)', role: 'buyer', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80' },
  { id: 'av6', label: 'Kavita (Architect)', role: 'buyer', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80' }
];
