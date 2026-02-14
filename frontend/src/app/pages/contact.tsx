import { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Mail, MessageSquare, Send, HelpCircle } from "lucide-react";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // In production, this would send to an API
  };

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl text-[#F5F5F0] mb-4">Get In Touch</h1>
            <p className="text-xl text-[#9CA89F]">
              Have questions about MushroomRadar? We're here to help.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="md:col-span-2">
              <Card className="p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="w-6 h-6 text-[#4A7C5D]" />
                  <h2 className="text-2xl text-[#F5F5F0]">Send Us a Message</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[#F5F5F0]">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-[#0A0E0C] border-[#2D5F3F]/50 text-[#F5F5F0] focus:border-[#4A7C5D]"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#F5F5F0]">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-[#0A0E0C] border-[#2D5F3F]/50 text-[#F5F5F0] focus:border-[#4A7C5D]"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-[#F5F5F0]">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="bg-[#0A0E0C] border-[#2D5F3F]/50 text-[#F5F5F0] focus:border-[#4A7C5D]"
                      placeholder="How can we help?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-[#F5F5F0]">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-[#0A0E0C] border-[#2D5F3F]/50 text-[#F5F5F0] focus:border-[#4A7C5D] min-h-[150px]"
                      placeholder="Tell us more about your inquiry..."
                      required
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-[#2D5F3F] hover:bg-[#4A7C5D] text-[#F5F5F0] flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
                <div className="flex items-start gap-3 mb-4">
                  <Mail className="w-5 h-5 text-[#4A7C5D] mt-1" />
                  <div>
                    <h3 className="text-sm text-[#F5F5F0] mb-1">Email</h3>
                    <p className="text-sm text-[#9CA89F]">support@mushroomradar.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-[#4A7C5D] mt-1" />
                  <div>
                    <h3 className="text-sm text-[#F5F5F0] mb-1">Live Chat</h3>
                    <p className="text-sm text-[#9CA89F]">Available 9AM-5PM CET</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
                <h3 className="text-sm text-[#F5F5F0] mb-3">Response Time</h3>
                <div className="space-y-2 text-sm text-[#9CA89F]">
                  <div className="flex justify-between">
                    <span>Basic:</span>
                    <span className="text-[#4A7C5D]">48-72 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pro:</span>
                    <span className="text-[#4A7C5D]">24-48 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise:</span>
                    <span className="text-[#4A7C5D]">Priority</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-[#4A7C5D] mt-1" />
                  <div>
                    <h3 className="text-sm text-[#F5F5F0] mb-2">Help Center</h3>
                    <p className="text-sm text-[#9CA89F] mb-3">
                      Browse our documentation and guides
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-[#2D5F3F] text-[#4A7C5D] hover:bg-[#1B3022] w-full"
                    >
                      Visit Help Center
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm text-center hover:border-[#4A7C5D] transition-all cursor-pointer">
              <h3 className="text-sm text-[#F5F5F0] mb-2">Documentation</h3>
              <p className="text-xs text-[#9CA89F]">API docs, guides, and tutorials</p>
            </Card>
            <Card className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm text-center hover:border-[#4A7C5D] transition-all cursor-pointer">
              <h3 className="text-sm text-[#F5F5F0] mb-2">Community Forum</h3>
              <p className="text-xs text-[#9CA89F]">Connect with other foragers</p>
            </Card>
            <Card className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm text-center hover:border-[#4A7C5D] transition-all cursor-pointer">
              <h3 className="text-sm text-[#F5F5F0] mb-2">Safety Resources</h3>
              <p className="text-xs text-[#9CA89F]">Identification guides and tips</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
