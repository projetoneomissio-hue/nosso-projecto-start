import { LucideIcon, BookOpen, Music, Trophy, Activity, Heart, Users, Sparkles, Palette } from "lucide-react";
import jiujitsuImage from "@/assets/jiujitsu-activity.jpg";
import musicImage from "@/assets/music-activity.jpg";
import educationImage from "@/assets/education-activity.jpg";
import pilatesImage from "@/assets/pilates-activity.jpg";
import volleyballImage from "@/assets/volleyball-activity.jpg";
import balletImage from "@/assets/ballet-activity.jpg";
import drawingImage from "@/assets/drawing-activity.jpg";
import englishImage from "@/assets/english-activity.jpg";
import cordasAmorImage from "@/assets/cordas-amor-activity.jpg";
import womenCounselingImage from "@/assets/women-counseling-activity.jpg";
import menCounselingImage from "@/assets/men-counseling-activity.jpg";
import testimonialMaria from "@/assets/testimonial-maria.jpg";
import testimonialLucas from "@/assets/testimonial-lucas.jpg";
import testimonialCarlos from "@/assets/testimonial-carlos.jpg";

export interface ActivityItem {
    title: string;
    description: string;
    price: string;
    frequency: string;
    schedule: string;
    targetAudience: string;
    note?: string;
    image: string;
    icon: LucideIcon;
    gradient: string;
}

export interface TestimonialItem {
    name: string;
    role: string;
    photo: string;
    feedback: string;
}

export const activities: ActivityItem[] = [
    {
        title: "Aulas de Desenho",
        description: "Técnicas de desenho incluindo animes, cartoons, realismo, anatomia humana, sombras, perspectivas e expressões.",
        price: "R$ 60,00/mês",
        frequency: "1x por semana",
        schedule: "Quartas-feiras, 19:00-20:00",
        targetAudience: "7-12 anos",
        note: "Criança deve trazer caderno, lápis, borracha, lápis de cor, giz e outros materiais conforme o professor pedir.",
        image: drawingImage,
        icon: Palette,
        gradient: "from-indigo-500 to-purple-500"
    },
    {
        title: "Aulas de Inglês",
        description: "Aulas de inglês utilizando material cristão, ensinando a língua de forma divertida e interativa.",
        price: "R$ 60,00/mês",
        frequency: "1x por semana",
        schedule: "Basic (7-12 anos): Sábados 9:00-11:00 | Basic 1 e 2: Segundas (fila de espera)",
        targetAudience: "Crianças e adolescentes de 7-15 anos",
        note: "Material didático semestral: R$ 100,00",
        image: englishImage,
        icon: BookOpen,
        gradient: "from-blue-500 to-cyan-500"
    },
    {
        title: "Jiu-Jitsu",
        description: "Aulas de Jiu-Jitsu para todas as idades, ministradas por instrutor faixa preta com vasta experiência.",
        price: "R$ 100,00/mês",
        frequency: "2x por semana",
        schedule: "Segunda e Quarta: Turma Infantil 18:30 | Adultos 19:30-21:00",
        targetAudience: "A partir de 5 anos até adultos",
        note: "Quimono não incluso.",
        image: jiujitsuImage,
        icon: Trophy,
        gradient: "from-red-500 to-orange-500"
    },
    {
        title: "Aulas de Violão",
        description: "Aulas de violão para iniciantes e intermediários com teoria musical e prática.",
        price: "R$ 80,00/mês",
        frequency: "1x por semana",
        schedule: "Quartas-feiras: Turma 1 17:00-18:00 | Turma 2 18:00-19:00",
        targetAudience: "A partir de 10 anos",
        note: "Aluno deve trazer seu próprio violão.",
        image: musicImage,
        icon: Music,
        gradient: "from-yellow-500 to-amber-500"
    },
    {
        title: "Ballet Infantil",
        description: "Aulas de ballet clássico para crianças, desenvolvendo coordenação, postura e expressão artística.",
        price: "R$ 80,00/mês",
        frequency: "1x por semana",
        schedule: "Sábados: Baby Class (3-5a) 9:00-10:00 | Preparatório (6-8a) 10:00-11:00 | Intermediário (9-13a) 11:00-12:00",
        targetAudience: "3 a 13 anos",
        note: "Uniforme: collant, meia calça e sapatilha (não inclusos na mensalidade).",
        image: balletImage,
        icon: Sparkles,
        gradient: "from-pink-500 to-rose-500"
    },
    {
        title: "Pilates",
        description: "Aulas de Pilates para adultos, focando em fortalecimento, flexibilidade e bem-estar.",
        price: "R$ 80,00/mês",
        frequency: "2x por semana",
        schedule: "Segundas e Quartas: 08:30-09:20",
        targetAudience: "Adultos (a partir de 18 anos)",
        image: pilatesImage,
        icon: Activity,
        gradient: "from-teal-500 to-emerald-500"
    },
    {
        title: "Vôlei",
        description: "Aulas de vôlei para crianças e adolescentes com foco em técnica, tática e espírito de equipe.",
        price: "R$ 60,00/mês",
        frequency: "1x por semana",
        schedule: "Sábados, 14:00-16:00",
        targetAudience: "8 a 14 anos",
        image: volleyballImage,
        icon: Trophy,
        gradient: "from-orange-500 to-yellow-500"
    },
    {
        title: "Reforço Escolar",
        description: "Acompanhamento educacional e reforço em matérias escolares para crianças e adolescentes.",
        price: "R$ 60,00/mês",
        frequency: "1x por semana",
        schedule: "Quartas-feiras: 14:00-15:30",
        targetAudience: "6-15 anos",
        image: educationImage,
        icon: BookOpen,
        gradient: "from-violet-500 to-purple-500"
    },
    {
        title: "Cordas do Amor",
        description: "Aulas de violino para crianças e adolescentes, com acompanhamento de teoria musical.",
        price: "R$ 80,00/mês",
        frequency: "1x por semana",
        schedule: "Quintas-feiras: Turma 1 17:00-18:00 | Turma 2 18:00-19:00",
        targetAudience: "7-15 anos",
        image: cordasAmorImage,
        icon: Music,
        gradient: "from-amber-500 to-red-500"
    },
    {
        title: "Aconselhamento Feminino",
        description: "Grupo de apoio e aconselhamento voltado para mulheres, trabalhando questões emocionais e espirituais.",
        price: "Gratuito",
        frequency: "1x por semana",
        schedule: "Quintas-feiras: 19:00-21:00",
        targetAudience: "Mulheres adultas",
        image: womenCounselingImage,
        icon: Heart,
        gradient: "from-rose-400 to-pink-500"
    },
    {
        title: "Aconselhamento Masculino",
        description: "Grupo de apoio e mentoria para homens, focando em liderança, paternidade e desenvolvimento pessoal.",
        price: "Gratuito",
        frequency: "1x por semana",
        schedule: "Terças-feiras: 19:30-21:00",
        targetAudience: "Homens adultos",
        image: menCounselingImage,
        icon: Users,
        gradient: "from-blue-400 to-indigo-500"
    }
];

export const testimonials: TestimonialItem[] = [
    {
        name: "Maria Aparecida",
        role: "Mãe da Ana (Ballet)",
        photo: testimonialMaria,
        feedback: "O Neo Missio transformou a vida da minha filha. O ballet trouxe disciplina, confiança e alegria. Os professores são incríveis e o ambiente é acolhedor!"
    },
    {
        name: "Lucas Ferreira",
        role: "Aluno de Jiu-Jitsu",
        photo: testimonialLucas,
        feedback: "Comecei no Jiu-Jitsu há 2 anos e mudou minha vida completamente. Aprendi disciplina, respeito e faço parte de uma família. Recomendo para todos!"
    },
    {
        name: "Carlos Roberto",
        role: "Pai do Pedro",
        photo: testimonialCarlos,
        feedback: "Meu filho participa do vôlei e das aulas de desenho. Ver ele feliz e desenvolvendo suas habilidades não tem preço. O Neo Missio é uma bênção para nossa comunidade!"
    }
];
