import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  HeartIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import TeamSection from '../components/TeamSection';

const LandingPage = () => {
  const features = [
    {
      icon: <HeartIcon className="h-8 w-8 text-red-500" />,
      title: "Save Lives",
      description: "Connect blood donors with recipients in real-time emergencies"
    },
    {
      icon: <ClockIcon className="h-8 w-8 text-red-500" />,
      title: "Instant Matching",
      description: "Find compatible blood donors and hospitals within minutes"
    },
    {
      icon: <MapPinIcon className="h-8 w-8 text-red-500" />,
      title: "Location-Based",
      description: "Discover donors and blood banks near your location"
    },
    {
      icon: <ShieldCheckIcon className="h-8 w-8 text-red-500" />,
      title: "Verified Network",
      description: "All donors and hospitals are verified for safety and reliability"
    }
  ];

  const userTypes = [
    {
      icon: <UserGroupIcon className="h-12 w-12 text-blue-500" />,
      title: "Recipients",
      description: "Find blood donors and hospitals quickly in emergencies",
      color: "blue"
    },
    {
      icon: <HeartSolidIcon className="h-12 w-12 text-red-500" />,
      title: "Donors",
      description: "Save lives by donating blood to those in need",
      color: "red"
    },
    {
      icon: <BuildingOfficeIcon className="h-12 w-12 text-green-500" />,
      title: "Hospitals",
      description: "Manage blood inventory and respond to requests",
      color: "green"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-teal-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-red-200 rounded-full opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-teal-200 rounded-full opacity-20"
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="flex justify-center mb-8"
            >
              <div className="relative">
                <HeartSolidIcon className="h-24 w-24 text-red-500" />
                <motion.div
                  className="absolute inset-0 bg-red-500 rounded-full opacity-20"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-7xl font-bold text-gray-900 mb-6"
            >
              BloodNet<span className="text-red-500">+</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-medium"
            >
              Connecting Lives, Saving Lives
              <br />
              <span className="text-lg text-gray-500 font-normal">
                Real-time blood donation platform connecting donors, recipients, and hospitals
              </span>
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link to="/register">
                <Button size="lg" className="shadow-xl hover:shadow-2xl">
                  Get Started Now
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose BloodNet+?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform makes blood donation and requests simple, fast, and reliable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Card className="text-center p-8 h-full">
                  <motion.div
                    className="flex justify-center mb-6"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-4 bg-red-50 rounded-2xl group-hover:bg-red-100 transition-colors">
                      {feature.icon}
                    </div>
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Who Can Join BloodNet+?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform serves everyone in the blood donation ecosystem
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((userType, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Card className="p-8 h-full">
                  <motion.div
                    className="flex justify-center mb-8"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`p-6 rounded-3xl ${
                      userType.color === 'blue' ? 'bg-blue-100' :
                      userType.color === 'red' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {userType.icon}
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    {userType.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {userType.description}
                  </p>
                  <motion.div
                    className="mt-6 text-center"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More
                    </Button>
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSection />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-red-500 to-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <motion.div
          className="absolute top-0 left-0 w-full h-full"
          animate={{
            background: [
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)",
              "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Save Lives?
            </h2>
            <p className="text-xl text-red-100 mb-12 max-w-3xl mx-auto">
              Join BloodNet+ today and become part of a life-saving community
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/register">
                <Button size="lg" className="bg-white text-red-500 hover:bg-gray-100 shadow-2xl">
                  Register Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
