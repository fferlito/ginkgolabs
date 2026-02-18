import React, { useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, Star } from "lucide-react";
import { Link } from "react-router";

export function PricingPage() {
  const [yearly, setYearly] = useState(false);

  const pricingTiers = [
    {
      name: "Basic",
      priceMonthly: 2.99,
      price: "€2.99",
      period: "/month",
      trial: "1 week free trial",
      description: "Perfect for casual foragers",
      features: [
        "1 Region access",
        "3-day forecast",
        "Popular species only",
        "Basic probability maps",
        "Mushroompedia",
        "Mobile app access",
      ],
      cta: "Start free trial",
      highlighted: false,
    },
    {
      name: "Premium",
      priceMonthly: 5.99,
      price: "€5.99",
      period: "/month",
      trial: "1 week free trial",
      description: "For serious mycologists",
      features: [
        "Full Nation coverage",
        "7-day forecast",
        "All species database",
        "Advanced environmental data",
        "Email support",
        "Mushroompedia",
        "Mobile app access",
      ],
      cta: "Start free trial",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      priceMonthly: undefined as number | undefined,
      price: "Custom",
      period: "",
      trial: "",
      description: "Tailored solutions for organizations",
      features: [
        "Global coverage",
        "Custom data layers",
        "API access",
        "Dedicated support",
        "Team collaboration",
        "Custom ML models",
        "Mushroompedia",
        "Mobile app access",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen py-24">
      {/* Header */}
      <section className="container mx-auto px-6 mb-16">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-5xl text-[#F5F5F0]">Choose Your Plan</h1>
          <p className="text-xl text-[#9CA89F]">
            Start with a 1-week free trial. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-sm font-medium ${!yearly ? "text-[#F5F5F0]" : "text-[#9CA89F]"}`}>Monthly</span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              onClick={() => setYearly((y) => !y)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border border-[#2D5F3F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A7C5D] focus:ring-offset-2 focus:ring-offset-[#0A0E0C] ${yearly ? "bg-[#4A7C5D]" : "bg-[#1B3022]"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-[#F5F5F0] shadow ring-0 transition translate-x-0.5 ${yearly ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
            <span className={`flex flex-col items-start ${yearly ? "text-[#F5F5F0]" : "text-[#9CA89F]"}`}>
              <span className="text-sm font-medium">Yearly</span>
              <span className="text-xs text-[#4A7C5D]">(Save 10%)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-6 mb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, idx) => (
            <Card
              key={idx}
              className={`p-8 relative ${
                tier.highlighted
                  ? "bg-[#2D5F3F]/20 border-[#4A7C5D] shadow-2xl shadow-[#2D5F3F]/20 scale-105"
                  : "bg-[#1B3022]/40 border-[#2D5F3F]/30"
              } backdrop-blur-sm transition-all hover:border-[#4A7C5D]`}
            >
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#D4AF37] text-[#0A0E0C] px-4 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl text-[#F5F5F0] mb-2">{tier.name}</h3>
                <p className="text-sm text-[#9CA89F]">{tier.description}</p>
              </div>

              <div className="mb-8">
                {yearly && tier.priceMonthly != null ? (
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl text-[#9CA89F] line-through tabular-nums">
                      €{(tier.priceMonthly * 12).toFixed(2)}
                    </span>
                    <span className="inline-flex items-baseline gap-1.5">
                      <span className="text-5xl font-semibold text-[#4A7C5D] tabular-nums">
                        €{(tier.priceMonthly * 12 * 0.9).toFixed(2)}
                      </span>
                      <span className="text-[#9CA89F]">/year</span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl text-[#F5F5F0]">{tier.price}</span>
                    <span className="text-[#9CA89F]">{tier.period}</span>
                  </div>
                )}
                {yearly && tier.priceMonthly != null && (
                  <p className="text-xs text-[#9CA89F] mt-2">
                    €{tier.priceMonthly.toFixed(2)}/mo billed annually
                  </p>
                )}
                {tier.trial && (
                  <p className="text-sm text-[#4A7C5D] mt-2">{tier.trial}</p>
                )}
              </div>

              <div className="space-y-4 mb-8">
                {tier.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <div className="mt-1 rounded-full p-0.5 bg-[#2D5F3F]">
                      <Check className="w-4 h-4 text-[#F5F5F0]" />
                    </div>
                    <span className="text-sm text-[#9CA89F]">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/dashboard">
                <Button
                  className={`w-full ${
                    tier.highlighted
                      ? "bg-[#4A7C5D] hover:bg-[#2D5F3F] text-[#F5F5F0]"
                      : "bg-[#1B3022] hover:bg-[#2D5F3F] text-[#F5F5F0] border border-[#2D5F3F]"
                  }`}
                >
                  {tier.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Comparison */}
      <section className="container mx-auto px-6 mb-16">
        <Card className="p-8 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm max-w-4xl mx-auto">
          <h3 className="text-2xl text-[#F5F5F0] mb-6">All Plans Include</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Real-time ML predictions",
              "Satellite data integration",
              "Mobile-optimized interface",
              "Regular model updates",
              "Community sightings feed",
              "Educational resources",
              "Safety disclaimers",
              "GDPR compliant",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="rounded-full p-1 bg-[#2D5F3F]">
                  <Check className="w-4 h-4 text-[#F5F5F0]" />
                </div>
                <span className="text-[#9CA89F]">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl text-[#F5F5F0] mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I switch plans at any time?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and SEPA direct debit for European customers.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All paid plans come with a 1-week free trial. No credit card required to start.",
              },
              {
                q: "How accurate are the predictions?",
                a: "Our ML models achieve 85-92% accuracy depending on species and region, validated against 500,000+ verified sightings.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="p-6 bg-[#1B3022]/40 border-[#2D5F3F]/30 backdrop-blur-sm">
                <h4 className="text-lg text-[#F5F5F0] mb-2">{faq.q}</h4>
                <p className="text-[#9CA89F]">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}